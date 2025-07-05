import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024) // MB to bytes
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/pdf',
      'application/json',
      'application/xml',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

// Upload single file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
      id: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };

    res.json(fileInfo);
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload file'
    });
  }
});

// Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const filesInfo = req.files.map(file => ({
      id: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date()
    }));

    res.json({ files: filesInfo });
  } catch (error: any) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload files'
    });
  }
});

// Delete a file
router.delete('/:filename', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../uploads', req.params.filename);
    
    // Check if file exists
    await fs.access(filePath);
    
    // Delete the file
    await fs.unlink(filePath);
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.error('File deletion error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete file'
    });
  }
});

// Convert file to base64 (for image attachments)
router.get('/:filename/base64', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../uploads', req.params.filename);
    
    // Read file
    const fileBuffer = await fs.readFile(filePath);
    const base64 = fileBuffer.toString('base64');
    
    // Get file stats for mime type
    const stats = await fs.stat(filePath);
    
    res.json({
      filename: req.params.filename,
      base64,
      size: stats.size
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.error('Base64 conversion error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to convert file'
    });
  }
});

export default router;