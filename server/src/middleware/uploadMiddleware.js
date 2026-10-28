const multer = require('multer');
const path = require('path');
const config = require('../config/env');
const { ValidationError } = require('../utils/errors');

// Memory storage guarantees that the unencrypted PDF never touches the server's permanent disk
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    return cb(new ValidationError('Only PDF files are supported (.pdf).'), false);
  }

  if (file.mimetype !== 'application/pdf') {
    return cb(new ValidationError('Invalid MIME type. Must be application/pdf.'), false);
  }

  cb(null, true);
}

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxUploadSizeBytes,
    files: 1,
  },
  fileFilter,
});

module.exports = upload;
