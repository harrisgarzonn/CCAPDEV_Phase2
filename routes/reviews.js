const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/create', reviewController.createPage);
router.post('/', reviewController.create);
router.get('/:id/edit', reviewController.editPage);
router.put('/:id', reviewController.update);
router.delete('/:id', reviewController.delete);
router.post('/:id/helpful', reviewController.helpful);
router.post('/:id/unhelpful', reviewController.unhelpful);

module.exports = router;
