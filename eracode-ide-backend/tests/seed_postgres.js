const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'mysecretpassword',
    port: 5433,
});

async function seedData() {
    try {
        await client.connect();
        console.log('Connected to Postgres on port 5433');

        // Create table
        await client.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table "todos" created.');

        // Insert data
        await client.query(`
            INSERT INTO todos (title, completed) VALUES 
            ('Buy milk', false),
            ('Walk the dog', true),
            ('Learn Docker', false);
        `);
        console.log('Sample data inserted.');

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.end();
    }
}

seedData();
