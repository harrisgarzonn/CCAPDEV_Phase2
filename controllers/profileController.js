const { db } = require('../models/supabase');

exports.show = async (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/auth/login');
    }

    const userId = req.session.userId;

    try {
        const user = await db.get(
            "SELECT * FROM users WHERE id = $1",
            [userId]
        );
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        const reviews = await db.all(
            `SELECT r.*, e.name as establishment_name
             FROM reviews r
             JOIN establishments e ON r.establishment_id = e.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );

        const totalHelpful = reviews.reduce((sum, r) => sum + (r.helpful_count || 0), 0);

        res.render('profile', {
            user,
            reviews: reviews || [],
            totalHelpful,
            currentUser: { id: req.session.userId, username: req.session.username }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching profile');
    }
};

exports.editPage = async (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/auth/login');
    }

    const userId = req.session.userId;

    try {
        const user = await db.get(
            "SELECT * FROM users WHERE id = $1",
            [userId]
        );
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('edit-profile', { 
            user,
            currentUser: { id: req.session.userId, username: req.session.username }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching profile');
    }
};

exports.update = async (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/auth/login');
    }

    const userId = req.session.userId;
    const { description } = req.body;

    try {
        await db.run(
            "UPDATE users SET description = $1 WHERE id = $2",
            [description, userId]
        );
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating profile');
    }
};

exports.viewUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await db.get(
            "SELECT * FROM users WHERE id = $1",
            [id]
        );
        
        if (!user) {
            return res.status(404).send('User not found');
        }

        const reviews = await db.all(
            `SELECT r.*, e.name as establishment_name, e.id as establishment_id
             FROM reviews r
             JOIN establishments e ON r.establishment_id = e.id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC`,
            [id]
        );

        const totalHelpful = reviews.reduce((sum, r) => sum + (r.helpful_count || 0), 0);

        res.render('user-profile', {
            user,
            reviews: reviews || [],
            totalHelpful,
            currentUser: req.session.userId ? { id: req.session.userId, username: req.session.username } : null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching user');
    }
};