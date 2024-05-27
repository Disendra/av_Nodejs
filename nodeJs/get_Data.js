// routes.js
const express = require('express');
const db = require('./dbConnection');

const router = express.Router();

router.get('/getLoginData', (req, res) => {
  let { page, pageSize, searchTerm } = req.query;
  page = parseInt(page, 10);
  pageSize = parseInt(pageSize, 10);
  const offset = Math.max(0, (page - 1) * pageSize);

  let sql = `SELECT * FROM signup_table`;
  const values = [];

  if (searchTerm) {
    sql += ` WHERE fullName LIKE ? OR companyName LIKE ?`;
    const searchPattern = `%${searchTerm}%`;
    values.push(searchPattern, searchPattern);
  }

  sql += ` LIMIT ?, ?`;
  values.push(offset, pageSize);

  handleQuery(sql, values, res);
});


router.get('/loginInfo', (req, res) => {
  const sql = 'SELECT * FROM login_Logs';
  handleQuery(sql, res);
});

router.get('/countByRoles', (req, res) => {
  const sql = 'SELECT role, COUNT(*) AS role_count FROM login_Data GROUP BY role;';
  handleQuery(sql, res);
});

function handleQuery(sql, values, res) {
  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    } else {
      return res.status(200).json({ success: true, records: result });
    }
  });
}

module.exports = router;
