const express = require('express');
const router = express.Router();
const defectController = require('../controllers/defectController');

router.post('/', defectController.createDefect);
router.get('/', defectController.getDefects);
router.put('/:id', defectController.updateDefect);
router.delete('/:id', defectController.deleteDefect);

module.exports = router;
