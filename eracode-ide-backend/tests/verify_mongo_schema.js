// using native fetch

async function testMongoSchema() {
    console.log('1. Connecting to MongoDB...');
    const connectRes = await fetch('http://localhost:3001/api/database/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Mongo',
            type: 'mongodb',
            host: 'localhost',
            port: 27017,
            database: 'test',
            username: 'admin',
            password: 'password123'
        })
    });
    const connectData = await connectRes.json();
    if (!connectRes.ok) {
        console.error('Connection failed:', connectData);
        return;
    }
    const connectionId = connectData.connectionId;
    console.log('Connected, ID:', connectionId);

    // Insert a dummy doc if not exists, to ensure we have something to sample
    console.log('2. Inserting dummy document to ensure schema inference works...');
    await fetch('http://localhost:3001/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            connectionId,
            query: JSON.stringify({
                collection: 'users',
                action: 'insertOne',
                filter: { name: "Alice", age: 30, email: "alice@example.com", isAdmin: false }
            })
        })
    });

    console.log('3. Fetching Schema...');
    const schemaRes = await fetch(`http://localhost:3001/api/database/schema?connectionId=${connectionId}`);
    const schemaData = await schemaRes.json();

    console.log('Schema Response:', JSON.stringify(schemaData, null, 2));

    const usersCollection = schemaData.collections.find(c => c.name === 'users');
    if (usersCollection && usersCollection.columns && usersCollection.columns.length > 0) {
        console.log('SUCCESS: Columns inferred for users collection:', usersCollection.columns);
    } else {
        console.error('FAILURE: No columns inferred for users collection.');
    }
}

testMongoSchema();
