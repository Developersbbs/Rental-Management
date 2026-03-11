const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, allowRoles } = require('../middlewares/authMiddlewares');
const {
    createAccessoryInward,
    getAllAccessoryInwards,
    importAccessoryInwardsFromExcel
} = require('../controllers/accessoryInwardController');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

router.post('/', protect, createAccessoryInward);
router.get('/', protect, getAllAccessoryInwards);
router.post('/import', protect, allowRoles('superadmin', 'stockmanager'), upload.single('file'), importAccessoryInwardsFromExcel);

module.exports = router;
