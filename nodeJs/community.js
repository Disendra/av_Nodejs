// routes.js
const express = require('express')
const db = require('./dbConnection');

const router = express.Router()


router.get('/getCommunityQuestions', (req, res) => {
    const { limit = 1, offset = 0, searchQuery = '' } = req.query; // Default limit to 1, offset to 0, and search query to empty string if not provided

    // Modify your SQL query to include the search condition
    const sql = `
    SELECT 
        c.qId, 
        c.emailId AS question_owner_email, 
        c.userName AS question_userName_name, 
        c.question, 
        c.ques_postedDate AS question_posted_date, 
        a.emailId AS answer_userName_email, 
        a.userName AS answer_owner_name, -- Include userName from community_answers
        a.answer, 
        a.ans_postedDate AS answer_posted_date, 
        f.likes, 
        f.dislikes, 
        f.comments, 
        f.views, 
        f.posted_date AS feedback_posted_date 
    FROM 
        (SELECT qId, emailId, userName, question, ques_postedDate FROM community_questions GROUP BY qId) AS c 
    LEFT JOIN 
        (SELECT qId, emailId, userName, answer, ans_postedDate FROM community_answers GROUP BY qId) AS a -- Include userName from community_answers
    ON 
        c.qId = a.qId 
    LEFT JOIN 
        (SELECT qId, likes, dislikes, comments, views, posted_date FROM community_feedback GROUP BY qId) AS f 
    ON 
        c.qId = f.qId 
    WHERE 
        c.question LIKE '%${searchQuery}%' OR
        a.answer LIKE '%${searchQuery}%' 
    LIMIT ${limit} OFFSET ${offset}`;

    console.log(sql);

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.status(500).json({ error: 'Error fetching records' });
        } else {
            console.log('Fetched records successfully');
            return res.send({ status: true, records: results, message: 'Details Fetched Successfully' });
        }
    });
});

router.get('/getMoreCommunityAnswers/:qId', (req, res) => {
    const qId = req.params.qId; // Extracting qId from the route parameters

    const sql = `
    SELECT 
        c.qId, 
        c.emailId AS question_owner_email, 
        c.question, 
        c.ques_postedDate AS question_posted_date, 
        c.userName AS question_userName, -- Assuming userName is a field in the community_questions table
        a.emailId AS answer_owner_email, 
        a.answer, 
        a.ans_postedDate AS answer_posted_date
    FROM 
        community_questions AS c
    LEFT JOIN 
        community_answers AS a ON c.qId = a.qId
    WHERE 
        c.qId = ?`;


    console.log(sql);

    db.query(sql, qId, (err, results) => {
        if (err) {
            console.error('Error fetching records:', err);
            res.status(500).json({ error: 'Error fetching records' });
        } else {
            console.log('Fetched records successfully');
            return res.send({ status: true, records: results, message: 'Details Fetched Successfully' });
        }
    });
});



  module.exports = router
