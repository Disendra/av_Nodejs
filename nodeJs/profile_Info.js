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
// const upload = multer(); 
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
AWS.config.update({
  accessKeyId: 'KJ9SPRHRL34JNQBWXC34',
  secretAccessKey: 'OBUzDlDHxL0aV3G8mGXDVGaGC65r3h9HQlbADGR9',
  region: 'us-east-1',
  endpoint: 'https://cellar-c2.services.clever-cloud.com'
});

// Create an S3 instance
const s3 = new AWS.S3();

router.get('/getProfile/:emailId', (req, res) => {
  const emailId = req.params.emailId;
  const sql = 'SELECT * FROM UserProfile WHERE emailId = ?';
  console.log(sql);
  fetchFromDatabase(res, sql, emailId);
});

router.get('/getProfile', (req, res) => {
  const emailId = req.params.emailId;
  const sql = 'SELECT emailId,companyName FROM UserProfile';
  console.log(sql);
  fetchFromDatabase(res, sql, emailId);
});


router.get('/getProfileImages', (req, res) => {
  const emailId = req.params.emailId;
  const sql = 'SELECT * FROM profile_Image';
  console.log(sql);
  fetchFromDatabase(res, sql, emailId);
});



router.get('/getSocialMediaProfile/:emailId', (req, res) => {
  const emailId = req.params.emailId;
  const sql = 'SELECT * FROM socialMediaPofile WHERE emailId = ?';
  console.log(sql);
  fetchFromDatabase(res, sql, emailId);
});

router.get('/getProfileImage/:emailId', (req, res) => {
  const emailId = req.params.emailId;
  const sql = 'SELECT * FROM profile_Image WHERE emailId = ?';
  console.log(sql);
  fetchFromDatabase(res, sql, emailId);
});

router.post('/insertProfile', upload.none(), (req, res) => {
  const { emailId, userName, userEmailId, mobileNumber, dob, gender, jobTitle, companyName, location, address1, address2, country, state, city, zipcode, stdCode } = req.body;
  const dateOfBirth = dob ? new Date(dob) : null;
  const postedDate = new Date();
  const data = { emailId, userName, userEmailId, mobileNumber, dob: dateOfBirth, gender, jobTitle, companyName, location, address1, address2, country, state, city, zipcode, postedDate, stdCode };
  insertIntoDatabase(res, 'UserProfile', data);
});

router.post('/updateProfile', upload.none(), (req, res) => {
  const { emailId, userName, userEmailId, mobileNumber, dob, gender, jobTitle, companyName, location, address1, address2, country, state, city, zipcode, stdCode } = req.body;
  const dateOfBirth = dob ? new Date(dob) : null;
  const postedDate = new Date();
  const data = { userName, userEmailId, mobileNumber, dob: dateOfBirth, gender, jobTitle, companyName, location, address1, address2, country, state, city, zipcode, postedDate, stdCode };
  updateDatabase(res, 'UserProfile', data, `emailId = '${emailId}'`);
});

router.post('/insertSocialMedia', upload.none(), (req, res) => {
  const { emailId, twitter, faceBook, instagram, linkedIn } = req.body;
  const postedDate = new Date();
  const data = { emailId, twitter, faceBook, instagram, linkedIn, postedDate };
  insertIntoDatabase(res, 'socialMediaPofile', data);
});

router.post('/updateSocialMedia', upload.none(), (req, res) => {
  const { emailId, twitter, faceBook, instagram, linkedIn } = req.body;
  const data = { twitter, faceBook, instagram, linkedIn };
  updateDatabase(res, 'socialMediaPofile', data, `emailId = '${emailId}'`);
});

router.post('/insertProfileImage', upload.single('image'), (req, res) => {
  const { emailId } = req.body;

  // Handle file upload here
  const imageBuffer = req.file.buffer;
  const imageName = req.file.originalname;

  uploadImageToS3(imageBuffer, imageName)
    .then((imageUrl) => {
      console.log('Image uploaded successfully:', imageUrl);
      const imagePath = imageUrl;
      const postedDate = new Date();
      const data = { emailId, imagePath, postedDate };
       console.log(data);
      const sql = 'INSERT INTO profile_Image SET ?';
    
      db.query(sql, data, (err, result) => {
        if (err) {
          console.error('Error inserting Profile Image:', err);
          return res.status(500).json({ error: 'Error inserting Profile Image' });
        }
        return res.json({ status: true, message: 'Profile Image Inserted successfully' });
      });
    })
    .catch((err) => {
      console.error('Error uploading image:', err);
      res.status(500).json({ error: 'Error uploading image' });
    });
});

router.post('/updateProfileImage', upload.single('image'), (req, res) => {
  const { emailId } = req.body;

  let imagePath = null; // Initialize imagePath to null

  // If a file is uploaded, store its path
  if (req.file) {
    const imageBuffer = req.file.buffer;
    const imageName = req.file.originalname;

    uploadImageToS3(imageBuffer, imageName)
      .then((imageUrl) => {
        console.log('Image uploaded successfully:', imageUrl);
        imagePath = imageUrl; // Update imagePath with the new image path
        updateprofileImageInfo();
      })
      .catch((err) => {
        console.error('Error uploading image:', err);
        return res.status(500).json({ error: 'Error uploading image' });
      });
  } else {
    // If no file is uploaded, retrieve the previous imagePath from the database
    const sqlSelectImagePath = 'SELECT imagePath FROM profile_Image WHERE emailId = ?';
    db.query(sqlSelectImagePath, [emailId], (err, result) => {
      if (err) {
        console.error('Error fetching previous image path:', err);
        return res.status(500).json({ error: 'Error fetching previous image path' });
      }
      if (result.length > 0) {
        imagePath = result[0].imagePath; // Retrieve the previous imagePath
      }
      updateprofileImageInfo();
    });
  }

  function updateprofileImageInfo() {
    const postedDate = new Date();
    const data = [emailId, imagePath,postedDate,emailId];
    console.log(data);
    const sql = 'UPDATE profile_Image SET emailId = ?, imagePath = ?,postedDate = ? WHERE emailId = ?';

    db.query(sql, data, (err, result) => {
      if (err) {
        console.error('Error inserting Profile Image:', err);
        return res.status(500).json({ error: 'Error inserting Profile Image' });
      }
      return res.json({ status: true, message: 'Profile Image Inserted successfully' });
    });
  }
});

router.get('/getProfileWeight/:emailId', (req, res) => {
  const emailId = req.params.emailId;
  
  // Define field weights for each table
  const userProfileWeights = {
    userName: 5,
    userEmailId: 5,
    mobileNumber: 5,
    dob: 5,
    gender: 5,
    jobTitle: 5,
    companyName: 5,
    location: 5,
    address1: 5,
    address2: 5,
    country: 5,
    state: 5,
    city: 5,
    zipcode: 5,
    // postedDate: 5
  };
  
  const socialMediaProfileWeights = {
    twitter: 5,
    faceBook: 5,
    instagram: 5,
    linkedIn: 5
  };
  
  const profileImageWeights = {
    imagePath: 10
  };

  let totalWeight = 0;
  db.query('SELECT * FROM UserProfile WHERE emailId = ?', [emailId], (err, userProfileResults) => {
    if (err) {
      console.error('Error fetching UserProfile records:', err);
      return res.status(500).json({ error: 'Error fetching records' });
    }

    if (userProfileResults[0]) { // Check if there is data
      Object.keys(userProfileWeights).forEach(field => {
        if (userProfileResults[0][field]) {
          totalWeight += userProfileWeights[field];
        }
      });
    }

    db.query('SELECT * FROM socialMediaPofile WHERE emailId = ?', [emailId], (err, socialMediaProfileResults) => {
      if (err) {
        console.error('Error fetching socialMediaPofile records:', err);
        return res.status(500).json({ error: 'Error fetching records' });
      }

      if (socialMediaProfileResults[0]) { // Check if there is data
        Object.keys(socialMediaProfileWeights).forEach(field => {
          if (socialMediaProfileResults[0][field]) {
            totalWeight += socialMediaProfileWeights[field];
          }
        });
      }

      db.query('SELECT * FROM profile_Image WHERE emailId = ?', [emailId], (err, profileImageResults) => {
        if (err) {
          console.error('Error fetching profile_Image records:', err);
          return res.status(500).json({ error: 'Error fetching records' });
        }

        if (profileImageResults[0]) { // Check if there is data
          Object.keys(profileImageWeights).forEach(field => {
            if (profileImageResults[0][field]) {
              totalWeight += profileImageWeights[field];
            }
          });
        }

        res.send({ status: true, profileWeight: totalWeight, message: 'Profile Weight Calculated Successfully' });
      });
    });
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
    Bucket: 'profile-image',
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

function fetchFromDatabase(res, sql, emailId) {
  db.query(sql, [emailId], (err, results) => {
    if (err) {
      console.error('Error fetching records:', err);
      res.status(500).json({ error: 'Error fetching records' });
    } else {
      console.log('Fetched records successfully');
      res.send({ status: true, records: results, message: 'Details Fetched Successfully' });
    }
  });
}
// Reusable function to handle database insertion
function insertIntoDatabase(res, tableName, data) {
  const sql = `INSERT INTO ${tableName} SET ?`;
  db.query(sql, data, (err, result) => {
    if (err) {
      console.error(`Error inserting data into ${tableName}:`, err);
      return res.status(500).json({ error: `Error inserting data into ${tableName}` });
    }
    return res.json({ status: true, message: 'Profile Saved Successfully' });
  });
}

// Reusable function to handle database update
function updateDatabase(res, tableName, data, condition) {
  const sql = `UPDATE ${tableName} SET ? WHERE ${condition}`;
  db.query(sql, [data, condition], (err, result) => {
    if (err) {
      console.error(`Error updating data in ${tableName}:`, err);
      return res.status(500).json({ error: `Error updating data in ${tableName}` });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    return res.json({ status: true, message: 'Profile Updated Successfully' });
  });
}

module.exports = router;