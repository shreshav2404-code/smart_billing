const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/smart_retail.db');
console.log('Connecting to database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting:', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
});

db.run("ALTER TABLE Users ADD COLUMN Role TEXT DEFAULT 'customer'", function (err) {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column Role already exists. Migration complete.');
        } else {
            console.error('Migration failed:', err.message);
        }
    } else {
        console.log('Migration successful. Added Role column to Users.');
    }
    db.close();
});
