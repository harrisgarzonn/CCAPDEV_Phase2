const { db } = require('../models/supabase');
const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.loginPage = (req, res) => {
    res.render('login');
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).render('login', { error: 'Username and password are required' });
    }

    try {
        const user = await db.get(
            "SELECT * FROM users WHERE username = $1",
            [username]
        );

        if (user) {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.userId = user.id;
                req.session.username = user.username;
                return res.redirect('/');
            }
        }
        res.status(401).render('login', { error: 'Invalid username or password' });
    } catch (err) {
        console.error(err);
        res.status(500).render('login', { error: 'Error logging in' });
    }
};

exports.registerPage = (req, res) => {
    res.render('register');
};

exports.register = async (req, res) => {
    const { username, password, confirmPassword, description } = req.body;

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
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await db.run(
            "INSERT INTO users (username, password, description) VALUES ($1, $2, $3)",
            [username, hashedPassword, description || '']
        );
        res.redirect('/auth/login?registered=true');
    } catch (err) {
        if (err.code === '23505') { // PostgreSQL unique violation
            return res.status(400).render('register', { error: 'Username already exists' });
        }
        console.error(err);
        res.status(500).render('register', { error: 'Error registering user' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
};