const express = require('express');
const router = express.Router();
const establishmentController = require('../controllers/establishmentController');

router.get('/:id', establishmentController.show);
router.post('/', establishmentController.create);
router.put('/:id', establishmentController.update);
router.delete('/:id', establishmentController.delete);

module.exports = router;
