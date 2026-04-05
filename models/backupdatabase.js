const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use /tmp directory on production (Railway/Render/Cyclic)
// This is the only writable location on free tiers
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production';
const dbPath = isProduction ? '/tmp/database.db' : './database.db';

console.log(`Using database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Establishments table
        db.run(`CREATE TABLE IF NOT EXISTS establishments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            category TEXT,
            description TEXT,
            rating REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Reviews table
        db.run(`CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            establishment_id INTEGER NOT NULL,
            rating INTEGER NOT NULL,
            title TEXT,
            body TEXT,
            helpful_count INTEGER DEFAULT 0,
            unhelpful_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(establishment_id) REFERENCES establishments(id)
        )`);

        console.log('Database tables initialized');
    });
}

module.exports = { db, initializeDatabase };
