const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'mydb.cfkaemm06o10.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Disendra',
  database: 'javadb'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to the MySQL database');
});

module.exports = db;
