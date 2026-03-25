const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/smart_retail.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');

db.exec(schema, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Database initialized.');
  }
  db.close();
});