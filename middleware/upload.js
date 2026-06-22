const multer = require('multer');
const path = require('path');

// Multer memory storage configuration (keeps file as buffer)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'videoFile' || file.fieldname === 'referenceVideo') {
    const filetypes = /mp4|webm|mov|avi|quicktime|mkv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /video\/mp4|video\/webm|video\/quicktime|video\/x-msvideo|video\/x-matroska/.test(file.mimetype);

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Only video files (mp4, webm, mov, avi) are allowed!'), false);
    }
  } else {
    // Images
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'), false);
    }
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit to support video files
  fileFilter
});

module.exports = upload;
