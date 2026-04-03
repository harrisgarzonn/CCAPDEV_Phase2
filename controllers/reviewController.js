const db = require('../models/database');

exports.createPage = (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login');
  }

  db.db.all("SELECT id, name FROM establishments ORDER BY name ASC", (err, establishments) => {
    if (err) {
      return res.status(500).send('Error fetching establishments');
    }

    res.render('create-review', { establishments: establishments || [] });
  });
};

exports.create = (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login');
  }

  const { establishment, category, rating, title, body } = req.body;
  const userId = req.session.userId;

  db.db.get(
    "SELECT id FROM establishments WHERE name = ?",
    [establishment],
    (err, est) => {
      let establishmentId;

      if (!est) {
        db.db.run(
          "INSERT INTO establishments (name, category, description) VALUES (?, ?, ?)",
          [establishment, category, ''],
          function(err) {
            if (err && !err.message.includes('UNIQUE')) {
              return res.status(500).send('Error creating establishment');
            }

            establishmentId = this.lastID;
            insertReview(userId, establishmentId, title, body, rating, res);
          }
        );
      } else {
        establishmentId = est.id;
        insertReview(userId, establishmentId, title, body, rating, res);
      }
    }
  );
};

function insertReview(userId, establishmentId, title, body, rating, res) {
  db.db.run(
    "INSERT INTO reviews (user_id, establishment_id, title, body, rating) VALUES (?, ?, ?, ?, ?)",
    [userId, establishmentId, title, body, rating],
    function(err) {
      if (err) {
        return res.status(500).send('Error creating review');
      }

      res.redirect(`/establishments/${establishmentId}`);
    }
  );
}

exports.editPage = (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login');
  }

  const { id } = req.params;

  db.db.get(
    "SELECT * FROM reviews WHERE id = ? AND user_id = ?",
    [id, req.session.userId],
    (err, review) => {
      if (err || !review) {
        return res.status(404).send('Review not found or not authorized');
      }

      db.db.all("SELECT id, name FROM establishments ORDER BY name ASC", (err, establishments) => {
        if (err) {
          return res.status(500).send('Error fetching establishments');
        }

        res.render('edit-review', { review, establishments: establishments || [] });
      });
    }
  );
};

exports.update = (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login');
  }

  const { id } = req.params;
  const { title, body, rating } = req.body;

  db.db.run(
    "UPDATE reviews SET title = ?, body = ?, rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
    [title, body, rating, id, req.session.userId],
    function(err) {
      if (err) {
        return res.status(500).send('Error updating review');
      }

      if (this.changes === 0) {
        return res.status(404).send('Review not found or not authorized');
      }

      db.db.get("SELECT establishment_id FROM reviews WHERE id = ?", [id], (err, review) => {
        if (err || !review) {
          return res.redirect('/profile');
        }

        res.redirect(`/establishments/${review.establishment_id}`);
      });
    }
  );
};

exports.delete = (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/auth/login');
  }

  const { id } = req.params;

  db.db.get("SELECT establishment_id FROM reviews WHERE id = ? AND user_id = ?", [id, req.session.userId], (err, review) => {
    if (err || !review) {
      return res.status(404).send('Review not found or not authorized');
    }

    db.db.run(
      "DELETE FROM reviews WHERE id = ? AND user_id = ?",
      [id, req.session.userId],
      (err) => {
        if (err) {
          return res.status(500).send('Error deleting review');
        }

        res.redirect(`/establishments/${review.establishment_id}`);
      }
    );
  });
};

exports.helpful = (req, res) => {
  const { id } = req.params;

  db.db.run(
    "UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating helpful count' });
      }

      res.json({ success: true });
    }
  );
};

exports.unhelpful = (req, res) => {
  const { id } = req.params;

  db.db.run(
    "UPDATE reviews SET unhelpful_count = unhelpful_count + 1 WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating unhelpful count' });
      }

      res.json({ success: true });
    }
  );
};
