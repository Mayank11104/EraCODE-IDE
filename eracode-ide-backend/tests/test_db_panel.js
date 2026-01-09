// Native fetch is available in Node 18+.
// Usage: node tests/test_db_panel.js

const BASE_URL = 'http://localhost:3001/api/database';

async function runTests() {
    console.log('🧪 Starting Database Panel API Tests...');

    // 1. Test Postgres Connection
    console.log('\nTesting PostgreSQL Connection...');
    try {
        const pgConfig = {
            type: 'postgres',
            name: 'Test Postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'mysecretpassword',
            database: 'postgres'
        };

        const pgConnect = await (await fetch(`${BASE_URL}/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pgConfig)
        })).json();

        if (pgConnect.success) {
            console.log('✅ Postgres Connected:', pgConnect.connectionId);

            // Get Schema
            const schema = await (await fetch(`${BASE_URL}/schema?connectionId=${pgConnect.connectionId}`)).json();
            console.log('✅ Postgres Schema Fetched:', schema.tables ? `${schema.tables.length} tables` : 'Failed');

            // Run Query
            const query = await (await fetch(`${BASE_URL}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionId: pgConnect.connectionId, query: 'SELECT NOW()' })
            })).json();
            console.log('✅ Postgres Query Result:', query.results ? query.results[0] : query.error);

        } else {
            console.error('❌ Postgres Connection Failed:', pgConnect.error);
        }

    } catch (e) {
        console.error('❌ Postgres Test Error:', e.message);
    }

    // 2. Test MongoDB Connection
    console.log('\nTesting MongoDB Connection...');
    try {
        const mongoConfig = {
            type: 'mongodb',
            name: 'Test Mongo',
            host: 'localhost',
            port: 27017,
            username: 'admin',
            password: 'password123',
            database: 'test'
        };

        const mongoConnect = await (await fetch(`${BASE_URL}/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mongoConfig)
        })).json();

        if (mongoConnect.success) {
            console.log('✅ MongoDB Connected:', mongoConnect.connectionId);

            // Get Schema
            const schema = await (await fetch(`${BASE_URL}/schema?connectionId=${mongoConnect.connectionId}`)).json();
            console.log('✅ MongoDB Schema Fetched:', schema.collections ? `${schema.collections.length} collections` : 'Failed');

        } else {
            // Expected to fail if container not ready or port blocked, but let's see.
            console.error('❌ MongoDB Connection Failed:', mongoConnect.error);
        }
    } catch (e) {
        console.error('❌ MongoDB Test Error:', e.message);
    }
}

runTests();
