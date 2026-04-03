const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.show);
router.get('/edit', profileController.editPage);
router.put('/', profileController.update);
router.get('/user/:id', profileController.viewUser);

module.exports = router;
