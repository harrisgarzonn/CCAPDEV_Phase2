const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/portal.db');
const db = new sqlite3.Database(dbPath);

const initializeDatabase = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS establishments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        establishment_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        rating INTEGER NOT NULL,
        helpful_count INTEGER DEFAULT 0,
        unhelpful_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (establishment_id) REFERENCES establishments(id)
      )
    `);

    seedData();
  });
};

const seedData = () => {
  db.all("SELECT COUNT(*) as count FROM users", (err, rows) => {
    if (rows && rows[0].count === 0) {
      const users = [
        { username: 'marquin', password: 'pass123', description: 'Second-year CS student who loves exploring new food spots around campus.' },
        { username: 'juan', password: 'pass123', description: 'Food enthusiast and campus explorer.' },
        { username: 'lisa', password: 'pass123', description: 'Daily lunch adventurer at campus establishments.' },
        { username: 'mark', password: 'pass123', description: 'Casual reviewer of campus spots.' },
        { username: 'sarah', password: 'pass123', description: 'Loyal customer and establishment supporter.' }
      ];

      users.forEach(user => {
        db.run(
          "INSERT INTO users (username, password, description) VALUES (?, ?, ?)",
          [user.username, user.password, user.description]
        );
      });

      const establishments = [
        { name: 'Agno Food Court', category: 'restaurant', description: 'Popular campus food court with Filipino and Asian cuisines.' },
        { name: 'Jollibee Taft', category: 'restaurant', description: 'Fast food restaurant near campus.' },
        { name: 'Starbucks Taft', category: 'store', description: 'Coffee shop perfect for studying.' },
        { name: 'SM City Taft', category: 'store', description: 'Shopping mall near campus.' },
        { name: 'Campus Library', category: 'service', description: 'Main library facility.' }
      ];

      establishments.forEach(est => {
        db.run(
          "INSERT INTO establishments (name, category, description) VALUES (?, ?, ?)",
          [est.name, est.category, est.description]
        );
      });

      db.all("SELECT id FROM users WHERE username = 'marquin'", (err, users) => {
        if (users && users.length > 0) {
          const userId = users[0].id;
          db.all("SELECT id FROM establishments WHERE name = 'Agno Food Court'", (err, ests) => {
            if (ests && ests.length > 0) {
              const estId = ests[0].id;
              const reviews = [
                {
                  user_id: userId,
                  establishment_id: estId,
                  title: 'Amazing Food Variety!',
                  body: 'I absolutely love this place! The food court has so many options - from Filipino comfort food to Japanese cuisine. The prices are very student-friendly and the portions are generous. My favorite is the Japanese stall, their katsudon is amazing! The seating area can get crowded during lunch rush but if you go a bit earlier or later, you will find a spot easily.',
                  rating: 5,
                  helpful_count: 24
                }
              ];

              reviews.forEach(review => {
                db.run(
                  "INSERT INTO reviews (user_id, establishment_id, title, body, rating, helpful_count) VALUES (?, ?, ?, ?, ?, ?)",
                  [review.user_id, review.establishment_id, review.title, review.body, review.rating, review.helpful_count]
                );
              });
            }
          });
        }
      });
    }
  });
};

module.exports = {
  db,
  initializeDatabase,
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};
