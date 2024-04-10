const express = require('express');
const bodyParser = require('body-parser');
const db = require('./dbConnection');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const router = express.Router();

router.post('/insertFeed', (req, res) => {
  const { sender, title, description, link, dltFeedDate } = req.body;
  const createdDate = new Date();
  const data = { sender, title, description, createdDate, link, dltFeedDate };

  const sql = 'INSERT INTO Community_Announcements SET ?';

  db.query(sql, data, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send({ status: false, message: err.message });
    } else {
      return res.send({ status: true, message: 'Feed Inserted Successfully' });
    }
  });
});

router.get('/getFeedData', (req, res) => {
  const sql = 'SELECT * FROM Community_Announcements ORDER BY createdDate DESC;';

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).send({ status: false, message: err.message });
    } else {
      return res.send({
        status: true,
        records: result,
        message: 'Details Fetched Successfully'
      });
    }
  });
});

const deleteExpiredRecords = () => {
  const currentDate = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD format
  const deleteSql = `DELETE FROM Community_Announcements WHERE dltFeedDate = '${currentDate}'`;

  db.query(deleteSql, (err, result) => {
    if (err) {
      console.error('Error deleting expired records:', err);
    } else {
      console.log('Expired records deleted successfully.');
    }
  });
};

// Schedule the task to run every day at midnight (00:00)
cron.schedule('58 23 * * *', () => {
  deleteExpiredRecords();
});

module.exports = router;
