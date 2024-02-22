// routes.js
const express = require('express')
const bodyParser = require('body-parser');
const db = require('./dbConnection');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const router = express.Router()

router.post('/insertFeed', (req, res) => {
  const { sender, title, description,link } = req.body
  const createdDate = new Date()

  const data = { sender, title, description, createdDate,link }

  const sql = 'INSERT INTO Community_Announcements SET ?'

  db.query(sql, data, (err, result) => {
    if (err) {
      console.log(err)
        return res.status(500).send({ status: false, message: err.message })
      }
     else {
      return res.send({ status: true, message: 'Feed Inserted Successfully' })
    }
  })
})

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


module.exports = router
