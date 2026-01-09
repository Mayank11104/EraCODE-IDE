const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');

class DatabaseService {
    constructor() {
        this.connections = new Map(); // Store active connections
        this.connectionConfigs = new Map(); // Store configs
    }

    // Connect to a database
    async connect(config) {
        const { type, name, host, port, username, password, database, file } = config;
        const connectionId = name || `${type}_${Date.now()}`;

        try {
            let connection;
            if (['postgres', 'mysql', 'sqlite', 'mariadb'].includes(type)) {
                connection = await this._connectSql(config);
            } else if (type === 'mongodb') {
                connection = await this._connectMongo(config);
            } else {
                throw new Error(`Unsupported database type: ${type}`);
            }

            this.connections.set(connectionId, { type, connection });
            this.connectionConfigs.set(connectionId, config);

            return { success: true, connectionId, message: 'Connected successfully' };
        } catch (error) {
            console.error('Database connection error:', error);
            throw new Error(`Failed to connect: ${error.message}`);
        }
    }

    async _connectSql(config) {
        const { type, host, port, username, password, database, file } = config;

        let sequelizeConfig = {
            dialect: type === 'postgres' ? 'postgres' : type,
            logging: false,
        };

        if (type === 'sqlite') {
            sequelizeConfig.storage = file;
        } else {
            sequelizeConfig.host = host;
            sequelizeConfig.port = port;
            sequelizeConfig.username = username;
            sequelizeConfig.password = password;
            sequelizeConfig.database = database;
        }

        const sequelize = new Sequelize(sequelizeConfig);
        await sequelize.authenticate();
        return sequelize;
    }

    async _connectMongo(config) {
        const { host, port, username, password, database } = config;
        // Construct URI. If username/pass provided, use them.
        let uri = `mongodb://${host}:${port}/${database}`;
        if (username && password) {
            uri = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
        }

        // Mongoose connects globally by default, but we might want independent connections.
        // simpler to use mongoose.createConnection for multiple DBs support
        const connection = await mongoose.createConnection(uri).asPromise();
        return connection;
    }

    // Get schema (tables/collections & relationships)
    async getSchema(connectionId) {
        const session = this.connections.get(connectionId);
        if (!session) throw new Error('Connection not found');

        const { type, connection } = session;

        if (['postgres', 'mysql', 'sqlite', 'mariadb'].includes(type)) {
            return await this._getSqlSchema(connection);
        } else if (type === 'mongodb') {
            return await this._getMongoSchema(connection);
        }
    }

    async _getSqlSchema(sequelize) {
        const queryInterface = sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();

        const schema = { tables: [] };

        for (const tableName of tables) {
            // Handle SQLite returning objects instead of strings sometimes
            const name = typeof tableName === 'object' ? tableName.tableName : tableName;

            const columnsObj = await queryInterface.describeTable(name);
            // Normalize columns to array { field: 'name', type: 'TYPE' }
            const columns = Object.keys(columnsObj).map(colName => ({
                field: colName,
                type: columnsObj[colName].type,
                primaryKey: columnsObj[colName].primaryKey,
                allowNull: columnsObj[colName].allowNull
            }));

            // Get detailed table info for foreign keys? 
            // Sequelize describeTable gives columns and basic constraints.
            // For FKs, it's dialect specific query or advanced logic.
            // For MVP, lets trust describeTable and maybe getForeignKeyReferences if available.

            let foreignKeys = [];
            try {
                foreignKeys = await queryInterface.getForeignKeyReferencesForTable(name);
            } catch (e) {
                // Not all dialects support this easily in all versions
            }

            schema.tables.push({
                name,
                columns,
                foreignKeys
            });
        }

        return schema;
    }

    async _getMongoSchema(connection) {
        const collections = await connection.db.listCollections().toArray();

        // Enrich with field inference by sampling 1 doc
        const detailedCollections = await Promise.all(collections.map(async (c) => {
            const coll = connection.db.collection(c.name);
            const sample = await coll.findOne({});
            let columns = [];
            if (sample) {
                columns = Object.keys(sample).map(key => {
                    let type = typeof sample[key];
                    if (type === 'object' && sample[key] === null) type = 'null';
                    else if (Array.isArray(sample[key])) type = 'array';
                    else if (key === '_id') type = 'ObjectId'; // simplistic
                    return { field: key, type };
                });
            }
            return { name: c.name, type: c.type, columns };
        }));

        return {
            collections: detailedCollections
        };
    }

    // Execute raw query
    async executeQuery(connectionId, query) {
        const session = this.connections.get(connectionId);
        if (!session) throw new Error('Connection not found');

        const { type, connection } = session;

        if (['postgres', 'mysql', 'sqlite', 'mariadb'].includes(type)) {
            const [results] = await connection.query(query);
            return results;
        } else if (type === 'mongodb') {
            // For MongoDB, 'query' is tricky as it's typically JSON. 
            // We might expect the user to send a specialized format or simple find.
            // E.g. { collection: "users", action: "find", query: {} }
            // Or we can try to eval() a js string (DANGEROUS).
            // For MVP safely: let's assume query is an object: { collection, filter, action }

            try {
                const parsedQuery = typeof query === 'string' ? JSON.parse(query) : query;
                const { collection, action, filter } = parsedQuery;

                if (!connection.models[collection]) {
                    // If model doesn't exist, access driver directly
                    const coll = connection.db.collection(collection);
                    if (action === 'find') return await coll.find(filter || {}).toArray();
                    if (action === 'insertOne') return await coll.insertOne(filter);
                    // ... other actions
                    return { error: "Unsupported simple action" };
                }
            } catch (e) {
                return { error: "Invalid MongoDB query format. Expected JSON with collection, action, filter." };
            }
        }
    }
}

module.exports = new DatabaseService();
