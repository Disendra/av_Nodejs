// routes.js
const express = require('express');
const db = require('./dbConnection');

const router = express.Router();

function handleQuery(sql, res) {
  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    } else {
      return res.status(200).json({ success: true, records: result });
    }
  });
}

router.get('/getLoginData', (req, res) => {
  const sql = 'SELECT * FROM login_Data';
  handleQuery(sql, res);
});

router.get('/loginInfo', (req, res) => {
  const sql = 'SELECT * FROM login_Logs';
  handleQuery(sql, res);
});

router.get('/countByRoles', (req, res) => {
  const sql = 'SELECT role, COUNT(*) AS role_count FROM login_Data GROUP BY role;';
  handleQuery(sql, res);
});

module.exports = router;
