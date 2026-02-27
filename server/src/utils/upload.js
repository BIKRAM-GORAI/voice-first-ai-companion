import multer from "multer";
import path from "path";

// store file in memory (we'll send directly to STT later)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

export default upload;