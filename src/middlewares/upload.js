import path from 'path';
import multer from 'multer';

import config from '../../config.js';
import APIError from './../utils/APIError.js'

const allowedTypes = config.get('video.allowedTypes');
const uploadDirectory = config.get('video.uploadDirectory');
const maxSize = config.get('video.maxSize');

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, cb) => {
    const uniqueFileName = req.user.user_id +  "_" + Date.now();
    cb(null, uniqueFileName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) { 
    return cb(
      new APIError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, 400),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter,
});

export default upload;