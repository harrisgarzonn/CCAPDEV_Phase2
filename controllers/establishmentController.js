const { db } = require('../models/supabase');

exports.index = async (req, res) => {
    const { search, sort, category } = req.query;

    let query = `
        SELECT e.*, 
            ROUND(AVG(r.rating), 1) as avg_rating,
            COUNT(r.id) as review_count
        FROM establishments e
        LEFT JOIN reviews r ON e.id = r.establishment_id
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
        query += ` WHERE e.name LIKE $${paramIndex}`;
        params.push(`%${search}%`);
        paramIndex++;
    }

    if (category && category !== 'all') {
        if (params.length > 0) {
            query += ` AND e.category = $${paramIndex}`;
        } else {
            query += ` WHERE e.category = $${paramIndex}`;
        }
        params.push(category);
        paramIndex++;
    }

    query += " GROUP BY e.id";

    if (sort === 'rating-high') {
        query += " ORDER BY avg_rating DESC NULLS LAST";
    } else if (sort === 'rating-low') {
        query += " ORDER BY avg_rating ASC NULLS FIRST";
    } else if (sort === 'name-az') {
        query += " ORDER BY e.name ASC";
    } else if (sort === 'name-za') {
        query += " ORDER BY e.name DESC";
    } else {
        query += " ORDER BY e.created_at DESC";
    }

    try {
        const establishments = await db.all(query, params);
        
        const sortOptions = [
            { value: 'recent', label: 'Most Recent' },
            { value: 'rating-high', label: 'Highest Rating' },
            { value: 'rating-low', label: 'Lowest Rating' },
            { value: 'name-az', label: 'A to Z' },
            { value: 'name-za', label: 'Z to A' }
        ];

        res.render('index', {
            establishments: establishments || [],
            search: search || '',
            sortOptions,
            currentSort: sort || 'recent',
            currentCategory: category || 'all',
            currentUser: req.session.userId ? { id: req.session.userId, username: req.session.username } : null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching establishments');
    }
};

exports.show = async (req, res) => {
    const { id } = req.params;

    try {
        const establishment = await db.get(
            "SELECT * FROM establishments WHERE id = $1",
            [id]
        );
        
        if (!establishment) {
            return res.status(404).send('Establishment not found');
        }

        const reviews = await db.all(
            `SELECT r.*, u.username, u.description
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.establishment_id = $1
             ORDER BY r.created_at DESC`,
            [id]
        );

        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        res.render('establishment', {
            establishment,
            reviews: reviews || [],
            avgRating,
            currentUser: req.session.userId ? { id: req.session.userId, username: req.session.username } : null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching establishment');
    }
};

exports.create = async (req, res) => {
    const { name, category, description } = req.body;

    try {
        const result = await db.run(
            "INSERT INTO establishments (name, category, description) VALUES ($1, $2, $3)",
            [name, category, description]
        );
        res.redirect(`/establishments/${result.lastID}`);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).send('Establishment already exists');
        }
        console.error(err);
        res.status(500).send('Error creating establishment');
    }
};

exports.update = async (req, res) => {
    const { id } = req.params;
    const { name, category, description } = req.body;

    try {
        await db.run(
            "UPDATE establishments SET name = $1, category = $2, description = $3 WHERE id = $4",
            [name, category, description, id]
        );
        res.redirect(`/establishments/${id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating establishment');
    }
};

exports.delete = async (req, res) => {
    const { id } = req.params;

    try {
        await db.run("DELETE FROM establishments WHERE id = $1", [id]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting establishment');
    }
};