const { Pool } = require('pg');

// Force IPv4 by setting family: 4
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4  // This forces IPv4 instead of IPv6
});

// Helper functions to match the old SQLite style
const db = {
  // For SELECT queries that return rows
  get: async (sql, params) => {
    const result = await pool.query(sql, params);
    return result.rows[0];
  },
  // For SELECT that returns multiple rows
  all: async (sql, params) => {
    const result = await pool.query(sql, params);
    return result.rows;
  },
  // For INSERT/UPDATE/DELETE
  run: async (sql, params) => {
    const result = await pool.query(sql, params);
    return { lastID: result.rows[0]?.id || null };
  }
};

// Initialize tables (run once)
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS establishments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        category TEXT,
        description TEXT,
        rating REAL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        establishment_id INTEGER REFERENCES establishments(id),
        rating INTEGER NOT NULL,
        title TEXT,
        body TEXT,
        helpful_count INTEGER DEFAULT 0,
        unhelpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Supabase tables ready');
  } catch (err) {
    console.error('Error initializing database:', err.message);
  }
}

module.exports = { db, initializeDatabase, pool };