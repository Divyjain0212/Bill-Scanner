const express = require('express');
const router = express.Router();
const multer = require('multer');
const driveService = require('../services/driveService');
const fs = require('fs');
const os = require('os');

// Setup multer for temporary file storage
const upload = multer({ dest: os.tmpdir() });

// Upload a new bill
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { personName, billDate } = req.body;
    
    const result = await driveService.uploadFile(req.file, {
      personName,
      billDate
    });

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Search and list bills
router.get('/', async (req, res) => {
  try {
    const { personName, startDate, endDate } = req.query;
    let queryParts = [];
    
    if (personName) {
      // Using '=' because 'contains' is not supported for appProperties values, only exact match or presence
      queryParts.push(`appProperties has { key='personName' and value='${personName}' }`);
    }
    
    const queryStr = queryParts.join(' and ');
    let files = await driveService.getFiles(queryStr);

    // Filter dates in-memory since Drive API appProperties string comparisons are not robust for date ranges
    if (startDate || endDate) {
      files = files.filter(file => {
        const fileDate = file.appProperties?.billDate;
        if (!fileDate) return false; // Exclude if no date
        
        let isValid = true;
        if (startDate && fileDate < startDate) isValid = false;
        if (endDate && fileDate > endDate) isValid = false;
        return isValid;
      });
    }

    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Update a bill's metadata and optionally attachment
router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { personName, billDate } = req.body;
    
    const result = await driveService.updateFile(id, {
      personName,
      billDate
    }, req.file);
    
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a bill
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await driveService.deleteFile(id);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
