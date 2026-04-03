const express = require('express');
const router = express.Router();
const establishmentController = require('../controllers/establishmentController');

router.get('/', establishmentController.index);
router.get('/about', (req, res) => {
    res.render('about');
});
module.exports = router;
