const db = require('../models/database');

exports.show = (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login');
  }

  const userId = req.session.userId;

  db.db.get(
    "SELECT * FROM users WHERE id = ?",
    [userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).send('User not found');
      }

      db.db.all(
        `SELECT r.*, e.name as establishment_name
         FROM reviews r
         JOIN establishments e ON r.establishment_id = e.id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`,
        [userId],
        (err, reviews) => {
          if (err) {
            return res.status(500).send('Error fetching reviews');
          }

          const totalHelpful = reviews.reduce((sum, r) => sum + r.helpful_count, 0);

          res.render('profile', {
            user,
            reviews: reviews || [],
            totalHelpful
          });
        }
      );
    }
  );
};

exports.editPage = (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login');
  }

  const userId = req.session.userId;

  db.db.get(
    "SELECT * FROM users WHERE id = ?",
    [userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).send('User not found');
      }

      res.render('edit-profile', { user });
    }
  );
};

exports.update = (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login');
  }

  const userId = req.session.userId;
  const { description } = req.body;

  db.db.run(
    "UPDATE users SET description = ? WHERE id = ?",
    [description, userId],
    (err) => {
      if (err) {
        return res.status(500).send('Error updating profile');
      }

      res.redirect('/profile');
    }
  );
};

exports.viewUser = (req, res) => {
  const { id } = req.params;

  db.db.get(
    "SELECT * FROM users WHERE id = ?",
    [id],
    (err, user) => {
      if (err || !user) {
        return res.status(404).send('User not found');
      }

      db.db.all(
        `SELECT r.*, e.name as establishment_name, e.id as establishment_id
         FROM reviews r
         JOIN establishments e ON r.establishment_id = e.id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`,
        [id],
        (err, reviews) => {
          if (err) {
            return res.status(500).send('Error fetching reviews');
          }

          const totalHelpful = reviews.reduce((sum, r) => sum + r.helpful_count, 0);

          res.render('user-profile', {
            user,
            reviews: reviews || [],
            totalHelpful
          });
        }
      );
    }
  );
};
