// const mysql = require('mysql');
const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'mydb.cfkaemm06o10.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Disendra',
  database: 'javadb'
});



// const db = mysql.createConnection({
//   host: 'b80vvfgdi6efpgtfiznc-mysql.services.clever-cloud.com',
//   user: 'uykl1sm13wtl0tsu',
//   password: 'Yp6KGBD5CG8aaQL44cD0',
//   database: 'b80vvfgdi6efpgtfiznc'
// });



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

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to the MySQL database');
});


module.exports = db;
