// routes.js
const express = require('express');
const db = require('./dbConnection');
const nm = require('nodemailer');

const router = express.Router();

function sendMail(personName, emailId, mobileNumber, subject, message) {
    const transporter = nm.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: 'gdisendra@gmail.com',
            pass: 'bnkn ajsg kygz txmr'
        }
    });

    const options = {
        from: 'AV-Project',
        to: 'gdisendra@gmail.com,Rgbavuniverse@gmail.com',
        subject: "Contact Us Notification",
        html: `<h1>Hello, Somebody tried to contact Us</h1>
            <p>Person Name: ${personName}</p>
            <p>Email: ${emailId}</p>
            <p>Mobile Number: ${mobileNumber}</p>
            <p>Subject: ${subject}</p>
            <p>Message: ${message}</p>
        `
    };

    transporter.sendMail(options, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log("Email sent");
        }
    });
}

router.post('/contactUs', (req, res) => {
    const { personName, emailId, mobileNumber, subject, message } = req.body;
    const createdDate = new Date();
    sendMail(personName, emailId, mobileNumber, subject, message);
    const data = { personName, emailId, mobileNumber, subject, message, createdDate };
    const sql = 'INSERT INTO contactUs SET ?';

    db.query(sql, data, (err, result) => {
        if (err) {
            return res.send({ status: true, message: 'Failed to Submit' });
        } else {
            return res.send({ status: true, message: 'Your Request Submitted Successfully.' });
        }
    });
});

module.exports = router;
