const express = require('express');
const router = express.Router();
const defectController = require('../controllers/defectController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', defectController.getDefects);
router.post('/', defectController.createDefect);
router.get('/:id', defectController.getDefect);
router.put('/:id', defectController.updateDefect);
router.delete('/:id', defectController.deleteDefect);

module.exports = router;