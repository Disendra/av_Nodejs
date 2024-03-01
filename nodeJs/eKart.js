const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const db = require('./dbConnection');
const fs = require('fs');
const app = express();

const router = express.Router()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'assets/cart_Images');
  },
  filename: function (req, file, cb) {
    const emailId = req.body.emailId;
    if (!emailId) {
      return cb(new Error('Email ID not found in request body'));
    }
    const ext = path.extname(file.originalname);
    const fileName = emailId + '-' + Date.now() + ext; 
    cb(null, fileName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});


router.use('/images', express.static(path.join(__dirname, 'assets/cart_Images')));

router.get('/getCartData', (req, res) => {
  const query = 'SELECT * FROM seller_Info';

  db.query(query, (error, results, fields) => {
    if (error) {
      console.error('Error fetching records:', error);
      res.status(500).json({ error: 'Error fetching records' });
      return;
    }

    const dataWithImages = results.map(row => {
      const imagePath = row.imagePath;
      const imageUrl = `http://${req.headers.host}/images/${path.basename(imagePath)}`; // Use path.basename to get the file name
      return {
        ...row,
        imageUrl: imageUrl
      };
    });

    // res.json(dataWithImages);
    return res.send({
      status: true,
      records: dataWithImages,
      message: 'Details Fetched Successfully'
  });
  });
});


router.post('/insertCart', upload.single('image'), (req, res) => {
  const { emailId, title, description, location, mobileNumber, price } = req.body;
  
  if (!emailId || !title || !description || !location || !mobileNumber || !price) {
    return res.status(400).json({ error: 'Missing required fields in request body' });
  }

  // Get the file path of the uploaded image
  const imagePath = req.file ? req.file.path : '';

  const postedDate = new Date();
  const data = { emailId, title, description, location, mobileNumber, price, postedDate, imagePath };

  const sql = 'INSERT INTO seller_Info SET ?';

  db.query(sql, data, (err, result) => {
    if (err) {
      console.error('Error inserting seller info:', err);
      return res.status(500).json({ error: 'Error inserting seller info' });
    }
    return res.json({ status: true, message: 'Seller Information Inserted Successfully' });
  });
});

module.exports = router;