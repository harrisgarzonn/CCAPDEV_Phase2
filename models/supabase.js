const { Pool } = require('pg');
const dns = require('dns');

// Force DNS resolution to use IPv4
dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false,
    require: true
  },
  // Force IPv4 connection
  family: 4,
  connectionTimeoutMillis: 10000,
  keepAlive: true
});

// Helper functions
const db = {
  get: async (sql, params) => {
    const result = await pool.query(sql, params);
    return result.rows[0];
  },
  all: async (sql, params) => {
    const result = await pool.query(sql, params);
    return result.rows;
  },
  run: async (sql, params) => {
    const result = await pool.query(sql, params);
    return { lastID: result.rows[0]?.id || null };
  }
};

async function initializeDatabase() {
  try {
    // Test connection first
    await pool.query('SELECT 1');
    console.log('✅ Supabase connected successfully');

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

    // Insert sample data if tables are empty
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('📝 Inserting sample data...');
      const bcrypt = require('bcrypt');
      const sampleUsers = [
        { username: 'john_doe', password: 'password123', description: 'Local resident' },
        { username: 'jane_smith', password: 'password123', description: 'Business owner' },
        { username: 'mike_wilson', password: 'password123', description: 'Community organizer' }
      ];
      for (const user of sampleUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool.query(
          'INSERT INTO users (username, password, description) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
          [user.username, hashedPassword, user.description]
        );
      }
      console.log('✅ Sample users inserted');
    }
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }
}

module.exports = { db, initializeDatabase, pool };
