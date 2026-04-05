const { db } = require('../models/supabase');

exports.createPage = async (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/auth/login');
    }

    try {
        const establishments = await db.all(
            "SELECT id, name FROM establishments ORDER BY name ASC"
        );
        res.render('create-review', { 
            establishments: establishments || [],
            currentUser: { id: req.session.userId, username: req.session.username }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching establishments');
    }
};

async function insertReview(userId, establishmentId, title, body, rating, res) {
    try {
        await db.run(
            "INSERT INTO reviews (user_id, establishment_id, title, body, rating) VALUES ($1, $2, $3, $4, $5)",
            [userId, establishmentId, title, body, rating]
        );
        res.redirect(`/establishments/${establishmentId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating review');
    }
}

exports.create = async (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/auth/login');
    }

    const { establishment, category, rating, title, body } = req.body;
    const userId = req.session.userId;

    try {
        const est = await db.get(
            "SELECT id FROM establishments WHERE name = $1",
            [establishment]
        );

        if (!est) {
            const result = await db.run(
                "INSERT INTO establishments (name, category, description) VALUES ($1, $2, $3)",
                [establishment, category, '']
            );
            await insertReview(userId, result.lastID, title, body, rating, res);
        } else {
            await insertReview(userId, est.id, title, body, rating, res);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating review');
    }
};

exports.editPage = async (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/auth/login');
    }

    const { id } = req.params;

    try {
        const review = await db.get(
            "SELECT * FROM reviews WHERE id = $1 AND user_id = $2",
            [id, req.session.userId]
        );
        
        if (!review) {
            return res.status(404).send('Review not found or not authorized');
        }

        const establishments = await db.all(
            "SELECT id, name FROM establishments ORDER BY name ASC"
        );

        res.render('edit-review', { 
            review, 
            establishments: establishments || [],
            currentUser: { id: req.session.userId, username: req.session.username }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching review');
    }
};

exports.update = async (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/auth/login');
    }

    const { id } = req.params;
    const { title, body, rating } = req.body;

    try {
        const result = await db.run(
            "UPDATE reviews SET title = $1, body = $2, rating = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5",
            [title, body, rating, id, req.session.userId]
        );

        const review = await db.get("SELECT establishment_id FROM reviews WHERE id = $1", [id]);
        if (review) {
            res.redirect(`/establishments/${review.establishment_id}`);
        } else {
            res.redirect('/profile');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating review');
    }
};

exports.delete = async (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/auth/login');
    }

    const { id } = req.params;

    try {
        const review = await db.get(
            "SELECT establishment_id FROM reviews WHERE id = $1 AND user_id = $2",
            [id, req.session.userId]
        );
        
        if (!review) {
            return res.status(404).send('Review not found or not authorized');
        }

        await db.run(
            "DELETE FROM reviews WHERE id = $1 AND user_id = $2",
            [id, req.session.userId]
        );

        res.redirect(`/establishments/${review.establishment_id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting review');
    }
};

exports.helpful = async (req, res) => {
    const { id } = req.params;

    try {
        await db.run(
            "UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1",
            [id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating helpful count' });
    }
};

exports.unhelpful = async (req, res) => {
    const { id } = req.params;

    try {
        await db.run(
            "UPDATE reviews SET unhelpful_count = unhelpful_count + 1 WHERE id = $1",
            [id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating unhelpful count' });
    }
};