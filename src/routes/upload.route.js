const express = require('express');
const { upload, uploadAvatar, uploadAttachment } = require('../controllers/upload.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/avatar', upload.single('file'), uploadAvatar);
router.post('/attachment', upload.single('file'), uploadAttachment);

module.exports = router;
