// const mysql = require('mysql');
const mysql = require('mysql');

// const db = mysql.createConnection({
//   host: 'mydb.cfkaemm06o10.us-east-1.rds.amazonaws.com',
//   user: 'admin',
//   password: 'Disendra',
//   database: 'javadb'
// });


const dbConfig = {
  connectionLimit: 10, // Adjust according to your needs
  host: 'b80vvfgdi6efpgtfiznc-mysql.services.clever-cloud.com',
  user: 'uykl1sm13wtl0tsu',
  password: 'Yp6KGBD5CG8aaQL44cD0',
  database: 'b80vvfgdi6efpgtfiznc'
};

const pool = mysql.createPool(dbConfig);

// Attempt to reconnect if the connection is lost
pool.on('connection', function (connection) {
  console.log('New connection established');

  connection.on('error', function (err) {
    console.error('MySQL error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Attempting to reconnect...');
      pool.getConnection(function (error, newConnection) {
        if (error) {
          console.error('Failed to reconnect:', error);
        } else {
          console.log('Reconnected successfully');
          connection = newConnection;
        }
      });
    } else {
      throw err;
    }
  });
});

module.exports = pool;



// // const db = mysql.createConnection({
// //   host: 'localhost',
// //   user: 'root',
// //   password: 'Softsol@321',
// //   database: 'javadb'
// // });


// db.connect((err) => {
//   if (err) {
//     throw err;
//   }
//   console.log('Connected to the MySQL database');
// });


// module.exports = db;





// let db = mysql.createConnection({
//   host: 'b80vvfgdi6efpgtfiznc-mysql.services.clever-cloud.com',
//   user: 'uykl1sm13wtl0tsu',
//   password: 'Yp6KGBD5CG8aaQL44cD0',
//   database: 'b80vvfgdi6efpgtfiznc'
// });