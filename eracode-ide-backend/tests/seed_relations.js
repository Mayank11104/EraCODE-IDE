const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'mysecretpassword',
    port: 5433,
});

async function seedRelations() {
    try {
        await client.connect();
        console.log('Connected to Postgres on port 5433');

        // Drop existing tables if needed to ensure clean state
        await client.query(`DROP TABLE IF EXISTS comments;`);
        await client.query(`DROP TABLE IF EXISTS posts;`);
        await client.query(`DROP TABLE IF EXISTS users CASCADE;`);

        // Create Users
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL
            );
        `);
        console.log('Table "users" created.');

        // Create Posts (1:N with Users)
        await client.query(`
            CREATE TABLE posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                title VARCHAR(200) NOT NULL,
                content TEXT
            );
        `);
        console.log('Table "posts" created.');

        // Create Comments (1:N with Posts, 1:N with Users)
        await client.query(`
            CREATE TABLE comments (
                id SERIAL PRIMARY KEY,
                post_id INTEGER REFERENCES posts(id),
                user_id INTEGER REFERENCES users(id),
                text TEXT NOT NULL
            );
        `);
        console.log('Table "comments" created.');

        // Insert Data
        await client.query(`
            INSERT INTO users (username, email) VALUES 
            ('alice', 'alice@example.com'),
            ('bob', 'bob@example.com');
        `);

        await client.query(`
            INSERT INTO posts (user_id, title, content) VALUES 
            (1, 'Alice First Post', 'Hello world'),
            (2, 'Bob Thoughts', 'Databases are cool');
        `);

        await client.query(`
            INSERT INTO comments (post_id, user_id, text) VALUES 
            (1, 2, 'Nice post Alice!'),
            (2, 1, 'Agreed Bob.');
        `);

        console.log('Relational data inserted.');

    } catch (err) {
        console.error('Error seeding relations:', err);
    } finally {
        await client.end();
    }
}

seedRelations();
