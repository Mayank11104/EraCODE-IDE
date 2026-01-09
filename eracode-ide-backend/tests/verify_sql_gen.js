// Mock schema and activeTable
const schema = {
    tables: [
        {
            name: "users",
            columns: [
                { field: "id", type: "INTEGER" },
                { field: "name", type: "VARCHAR" },
                { field: "age", type: "INTEGER" },
                { field: "bio", type: "TEXT" }
            ]
        }
    ]
};
const activeTable = "users";

// Mock form values
const formValues = {
    id: "1",
    name: "O'Reilly", // Test escaping
    age: "30",
    bio: "" // Test empty string handling
};

// Logic copied from DatabasePanel.tsx
const columns = Object.keys(formValues).filter(k => formValues[k] !== '');
const cols = columns.map(c => `"${c}"`).join(', ');
const vals = columns.map(c => {
    const val = formValues[c];
    if (val === null || val === '') return 'NULL';
    if (!isNaN(Number(val)) && val.trim() !== '') return Number(val);
    return `'${val.replace(/'/g, "''")}'`;
}).join(', ');

const queryText = `INSERT INTO "${activeTable}" (${cols}) VALUES (${vals});`;

console.log("Generated Query:", queryText);

const expected = `INSERT INTO "users" ("id", "name", "age") VALUES (1, 'O''Reilly', 30);`;
if (queryText === expected) {
    console.log("SUCCESS: Query matches expectation.");
} else {
    console.error("FAILURE: Query mismatch.");
    console.error("Expected:", expected);
    console.error("Got:", queryText);
}
