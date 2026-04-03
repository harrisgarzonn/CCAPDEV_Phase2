const db = require('../models/database');
const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.loginPage = (req, res) => {
    res.render('login');
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    // Backend validation
    if (!username || !password) {
        return res.status(400).render('login', { error: 'Username and password are required' });
    }

    db.db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, user) => {
            if (err) {
                console.error(err);
                return res.status(500).render('login', { error: 'Error logging in' });
            }

            if (user) {
                // Compare the hashed password
                const match = await bcrypt.compare(password, user.password);
                if (match) {
                    req.session.userId = user.id;
                    req.session.username = user.username;
                    return res.redirect('/');
                }
            }
            
            res.status(401).render('login', { error: 'Invalid username or password' });
        }
    );
};

exports.registerPage = (req, res) => {
    res.render('register');
};

exports.register = async (req, res) => {
    const { username, password, confirmPassword, description } = req.body;

    // Backend validation
    if (!username || !password) {
        return res.status(400).render('register', { error: 'Username and password are required' });
    }

    if (password !== confirmPassword) {
        return res.status(400).render('register', { error: 'Passwords do not match' });
    }

    if (password.length < 6) {
        return res.status(400).render('register', { error: 'Password must be at least 6 characters' });
    }

    try {
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        db.db.run(
            "INSERT INTO users (username, password, description) VALUES (?, ?, ?)",
            [username, hashedPassword, description || ''],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).render('register', { error: 'Username already exists' });
                    }
                    console.error(err);
                    return res.status(500).render('register', { error: 'Error registering user' });
                }
                
                res.redirect('/auth/login?registered=true');
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).render('register', { error: 'Error registering user' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.redirect('/');
    });
};