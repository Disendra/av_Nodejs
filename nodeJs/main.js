// index.js
const express = require('express');
const cors = require('cors');
const db = require('./dbConnection');
const signUp = require('./signUp');
const feed = require('./feed');
const getUserData = require('./get_Data');
const eKart = require('./eKart');
const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

app.use('/', signUp);
app.use('/',feed);
app.use('/',getUserData);
app.use('/',eKart)

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
