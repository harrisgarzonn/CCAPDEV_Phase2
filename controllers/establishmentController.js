const db = require('../models/database');

exports.index = (req, res) => {
  const { search, sort, category } = req.query;

  let query = `
    SELECT e.*, 
      ROUND(AVG(r.rating), 1) as avg_rating,
      COUNT(r.id) as review_count
    FROM establishments e
    LEFT JOIN reviews r ON e.id = r.establishment_id
  `;

  const params = [];

  if (search) {
    query += " WHERE e.name LIKE ?";
    params.push(`%${search}%`);
  }

  if (category && category !== 'all') {
    if (params.length > 0) {
      query += " AND e.category = ?";
    } else {
      query += " WHERE e.category = ?";
    }
    params.push(category);
  }

  query += " GROUP BY e.id";

  if (sort === 'rating-high') {
    query += " ORDER BY avg_rating DESC";
  } else if (sort === 'rating-low') {
    query += " ORDER BY avg_rating ASC";
  } else if (sort === 'name-az') {
    query += " ORDER BY e.name ASC";
  } else if (sort === 'name-za') {
    query += " ORDER BY e.name DESC";
  } else {
    query += " ORDER BY e.created_at DESC";
  }

  db.db.all(query, params, (err, establishments) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching establishments');
    }

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
      currentCategory: category || 'all'
    });
  });
};

exports.show = (req, res) => {
  const { id } = req.params;

  db.db.get(
    "SELECT * FROM establishments WHERE id = ?",
    [id],
    (err, establishment) => {
      if (err || !establishment) {
        return res.status(404).send('Establishment not found');
      }

      db.db.all(
        `SELECT r.*, u.username, u.description
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.establishment_id = ?
         ORDER BY r.created_at DESC`,
        [id],
        (err, reviews) => {
          if (err) {
            return res.status(500).send('Error fetching reviews');
          }

          const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

          res.render('establishment', {
            establishment,
            reviews: reviews || [],
            avgRating,
            userId: req.session?.userId
          });
        }
      );
    }
  );
};

exports.create = (req, res) => {
  const { name, category, description } = req.body;

  db.db.run(
    "INSERT INTO establishments (name, category, description) VALUES (?, ?, ?)",
    [name, category, description],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).send('Establishment already exists');
        }
        return res.status(500).send('Error creating establishment');
      }

      res.redirect(`/establishments/${this.lastID}`);
    }
  );
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { name, category, description } = req.body;

  db.db.run(
    "UPDATE establishments SET name = ?, category = ?, description = ? WHERE id = ?",
    [name, category, description, id],
    (err) => {
      if (err) {
        return res.status(500).send('Error updating establishment');
      }

      res.redirect(`/establishments/${id}`);
    }
  );
};

exports.delete = (req, res) => {
  const { id } = req.params;

  db.db.run(
    "DELETE FROM establishments WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        return res.status(500).send('Error deleting establishment');
      }

      res.redirect('/');
    }
  );
};
