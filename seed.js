const db = require('./models/database');
const bcrypt = require('bcrypt');

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');
    
    // Initialize database
    db.initializeDatabase();
    
    // Wait for database to initialize
    setTimeout(async () => {
        try {
            // First, check if we already have data
            db.db.get("SELECT COUNT(*) as count FROM users", async (err, result) => {
                if (err) {
                    console.error('Error checking users:', err);
                    return;
                }
                
                if (result.count > 0) {
                    console.log(`✅ Database already has ${result.count} users. Skipping seed.`);
                    console.log('To re-seed, delete the database file first.');
                    return;
                }
                
                console.log('📝 Inserting sample data...');
                
                // 1. Insert 5 sample users (with hashed passwords)
                const users = [
                    { username: 'john_doe', password: 'password123', description: 'Local resident and food enthusiast' },
                    { username: 'jane_smith', password: 'password123', description: 'Business owner in the community' },
                    { username: 'mike_wilson', password: 'password123', description: 'Community organizer and volunteer' },
                    { username: 'sarah_connor', password: 'password123', description: 'Frequent reviewer and critic' },
                    { username: 'chris_evans', password: 'password123', description: 'New member exploring the area' }
                ];
                
                for (const user of users) {
                    const hashedPassword = await bcrypt.hash(user.password, 10);
                    await new Promise((resolve, reject) => {
                        db.db.run(
                            "INSERT INTO users (username, password, description) VALUES (?, ?, ?)",
                            [user.username, hashedPassword, user.description],
                            function(err) {
                                if (err) reject(err);
                                else resolve(this.lastID);
                            }
                        );
                    });
                    console.log(`   ✓ Added user: ${user.username}`);
                }
                
                // 2. Insert 5 sample establishments
                const establishments = [
                    { name: 'Cafe Milano', address: '123 Main Street', category: 'Restaurant', rating: 4.5 },
                    { name: 'Tech Hub Co-working', address: '456 Innovation Drive', category: 'Business', rating: 4.2 },
                    { name: 'Sunset Community Park', address: '789 Park Avenue', category: 'Park', rating: 4.8 },
                    { name: 'Central Public Library', address: '321 Knowledge Lane', category: 'Library', rating: 4.0 },
                    { name: 'Fitness First Gym', address: '555 Health Boulevard', category: 'Gym', rating: 4.3 }
                ];
                
                for (const est of establishments) {
                    await new Promise((resolve, reject) => {
                        db.db.run(
                            "INSERT INTO establishments (name, address, category, rating) VALUES (?, ?, ?, ?)",
                            [est.name, est.address, est.category, est.rating],
                            function(err) {
                                if (err) reject(err);
                                else resolve(this.lastID);
                            }
                        );
                    });
                    console.log(`   ✓ Added establishment: ${est.name}`);
                }
                
                // 3. Insert 5 sample reviews (referencing the users and establishments above)
                const reviews = [
                    { user_id: 1, establishment_id: 1, rating: 5, comment: 'Great coffee and amazing ambiance! Highly recommended.' },
                    { user_id: 2, establishment_id: 2, rating: 4, comment: 'Perfect place for remote work. Fast WiFi and comfortable chairs.' },
                    { user_id: 3, establishment_id: 3, rating: 5, comment: 'Beautiful park, very clean and family-friendly.' },
                    { user_id: 4, establishment_id: 4, rating: 4, comment: 'Quiet place to study with a great collection of books.' },
                    { user_id: 5, establishment_id: 5, rating: 4, comment: 'Well-equipped gym with knowledgeable trainers.' }
                ];
                
                for (const review of reviews) {
                    await new Promise((resolve, reject) => {
                        db.db.run(
                            "INSERT INTO reviews (user_id, establishment_id, rating, comment) VALUES (?, ?, ?, ?)",
                            [review.user_id, review.establishment_id, review.rating, review.comment],
                            function(err) {
                                if (err) reject(err);
                                else resolve(this.lastID);
                            }
                        );
                    });
                    console.log(`   ✓ Added review for establishment ID ${review.establishment_id}`);
                }
                
                console.log('\n✅ Database seeding completed successfully!');
                console.log('\n📊 Sample Data Summary:');
                console.log('   - 5 Users (password for all: "password123")');
                console.log('   - 5 Establishments');
                console.log('   - 5 Reviews');
                console.log('\n💡 You can now log in with any of these users:');
                users.forEach(u => console.log(`      Username: ${u.username}, Password: password123`));
            });
        } catch (error) {
            console.error('❌ Error seeding database:', error);
        }
    }, 1000);
}

// Run the seed function
seedDatabase();