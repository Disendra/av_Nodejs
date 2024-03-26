const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const AWS = require('aws-sdk');
const db = require('./dbConnection');
const app = express();
const cors = require('cors');
const router = express.Router()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
AWS.config.update({
  accessKeyId: 'KJ9SPRHRL34JNQBWXC34',
  secretAccessKey: 'OBUzDlDHxL0aV3G8mGXDVGaGC65r3h9HQlbADGR9',
  region: 'us-east-1',
  endpoint: 'https://cellar-c2.services.clever-cloud.com'
});

// Create an S3 instance
const s3 = new AWS.S3();
router.get('/getCartData', (req, res) => {
  const sql = 'SELECT * FROM seller_Info ORDER BY posteddate DESC;';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching records:', err);
      res.status(500).json({ error: 'Error fetching records' });
    } else {
      console.log('Fetched records successfully');
      return res.send({ status: true, records: results, message: 'Details Fetched Successfully'
    });
    }
  });
});


router.get('/getUploadData/:emailId', (req, res) => {
  const emailId = req.params.emailId; // Access emailId from URL parameter

  const sql = 'SELECT * FROM seller_Info WHERE emailId = ? ORDER BY posteddate DESC;';

  console.log(sql);

  db.query(sql, [emailId], (err, results) => {
    if (err) {
      console.error('Error fetching records:', err);
      res.status(500).json({ error: 'Error fetching records' });
    } else {
      console.log('Fetched records successfully');
      return res.send({ status: true, records: results, message: 'Details Fetched Successfully' });
    }
  });
});


router.post('/deleteCartRecords', (req, res) => {
  const { emailId,title,postedDate } = req.body; // Access email from request body

  const sql = 'DELETE FROM seller_Info WHERE emailId = ? AND title = ? AND postedDate = ?';

  db.query(sql, [emailId,title,postedDate], (err, result) => {
    if (err) {
      console.error('Error deleting records:', err);
      res.status(500).json({ error: 'Error deleting records' });
    } else {
      console.log('Deleted records successfully');
      const affectedRows = result ? result.affectedRows : 0;
      res.json({ status: true, affectedRows, message: 'Records Deleted Successfully' });
    }
  });
});

const upload = multer({ storage: multer.memoryStorage() });

router.post('/updateCart', upload.single('image'), (req, res) => {
  const { emailId, title, description, location, mobileNumber, price,slNo } = req.body;
   
  // Handle file upload here
  const imageBuffer = req.file.buffer;
  const imageName = req.file.originalname;

  uploadImageToS3(imageBuffer, imageName)
    .then((imageUrl) => {
      console.log('Image uploaded successfully:', imageUrl);
      const imagePath = imageUrl;
      const postedDate = new Date();
      const data = [ emailId, title, description, location, mobileNumber, price, postedDate, imagePath,slNo ];
       console.log(data);
      const sql = 'UPDATE seller_Info SET emailId = ?, title = ?, description = ?, location = ?, mobileNumber = ?, price = ?,postedDate = ?,imagePath = ? WHERE slNo = ?';
    
      db.query(sql, data, (err, result) => {
        if (err) {
          console.error('Error inserting seller info:', err);
          return res.status(500).json({ error: 'Error inserting seller info' });
        }
        return res.json({ status: true, message: 'Seller Information Inserted Successfully' });
      });
    })
    .catch((err) => {
      console.error('Error uploading image:', err);
      res.status(500).json({ error: 'Error uploading image' });
    });
});


router.post('/insertCart', upload.single('image'), (req, res) => {
  const { emailId, title, description, location, mobileNumber, price } = req.body;

  // Handle file upload here
  const imageBuffer = req.file.buffer;
  const imageName = req.file.originalname;

  uploadImageToS3(imageBuffer, imageName)
    .then((imageUrl) => {
      console.log('Image uploaded successfully:', imageUrl);
      const imagePath = imageUrl;
      const postedDate = new Date();
      const data = { emailId, title, description, location, mobileNumber, price, postedDate, imagePath };
       console.log(data);
      const sql = 'INSERT INTO seller_Info SET ?';
    
      db.query(sql, data, (err, result) => {
        if (err) {
          console.error('Error inserting seller info:', err);
          return res.status(500).json({ error: 'Error inserting seller info' });
        }
        return res.json({ status: true, message: 'Seller Information Inserted Successfully' });
      });
    })
    .catch((err) => {
      console.error('Error uploading image:', err);
      res.status(500).json({ error: 'Error uploading image' });
    });
});


function uploadImageToS3(imageBuffer, filename) {
  const fileExtension = filename.split('.').pop().toLowerCase();
  let contentType;
  switch (fileExtension) {
    case 'jpg':
    case 'jpeg':
      contentType = 'image/jpeg';
      break;
    case 'png':
      contentType = 'image/png';
      break;
    case 'gif':
      contentType = 'image/gif';
      break;
    default:
      contentType = 'application/octet-stream';
  }

  const params = {
    Bucket: 'cart-images',
    Key: filename,
    Body: imageBuffer,
    ACL: 'public-read',
    ContentType: contentType,
    ContentDisposition: 'inline'
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Location);
      }
    });
  });
}

module.exports = router;



// const router = express.Router()
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'assets/cart_Images');
//   },
//   filename: function (req, file, cb) {
//     const emailId = req.body.emailId;
//     if (!emailId) {
//       return cb(new Error('Email ID not found in request body'));
//     }
//     const ext = path.extname(file.originalname);
//     const fileName = emailId + '-' + Date.now() + ext; 
//     cb(null, fileName);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   fileFilter: function (req, file, cb) {
//     if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//       return cb(new Error('Only image files are allowed!'));
//     }
//     cb(null, true);
//   }
// });


// router.use('/images', express.static(path.join(__dirname, 'assets/cart_Images')));

// router.get('/getCartData', (req, res) => {
//   const query = 'SELECT * FROM seller_Info ORDER BY posteddate DESC;';

//   db.query(query, (error, results, fields) => {
//     if (error) {
//       console.error('Error fetching records:', error);
//       res.status(500).json({ error: 'Error fetching records' });
//       return;
//     }

//     const dataWithImages = results.map(row => {
//       const imagePath = row.imagePath;
//       const imageUrl = `http://${req.headers.host}/images/${path.basename(imagePath)}`; // Use path.basename to get the file name
//       return {
//         ...row,
//         imageUrl: imageUrl
//       };
//     });

//     // res.json(dataWithImages);
//     return res.send({
//       status: true,
//       records: dataWithImages,
//       message: 'Details Fetched Successfully'
//   });
//   });
// });


// router.post('/insertCart', upload.single('image'), (req, res) => {
//   const { emailId, title, description, location, mobileNumber, price } = req.body;
  
//   if (!emailId || !title || !description || !location || !mobileNumber || !price) {
//     return res.status(400).json({ error: 'Missing required fields in request body' });
//   }

//   // Get the file path of the uploaded image
//   const imagePath = req.file ? req.file.path : '';

//   const postedDate = new Date();
//   const data = { emailId, title, description, location, mobileNumber, price, postedDate, imagePath };

//   const sql = 'INSERT INTO seller_Info SET ?';

//   db.query(sql, data, (err, result) => {
//     if (err) {
//       console.error('Error inserting seller info:', err);
//       return res.status(500).json({ error: 'Error inserting seller info' });
//     }
//     return res.json({ status: true, message: 'Seller Information Inserted Successfully' });
//   });
// });

// module.exports = router;