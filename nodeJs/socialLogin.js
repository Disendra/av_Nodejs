const express = require('express');
const passport = require('passport');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('./dbConnection');
const fetch = require('node-fetch2');
const crypto = require('crypto');
const cors = require('cors');

router.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));
const secretKey = crypto.randomBytes(32).toString('hex');
router.use(passport.initialize());
router.use(passport.session());
router.use(cors());


let jwtToken;
let destination;
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// router.get('/socialSignup', (req, res) => {
//   res.send('<a href="/auth/google">Login with Google</a><br/><a href="/auth/linkedin">Login with LinkedIn</a>');
// });

router.get('/auth/google', (req, res)=>{
    destination = req.query.destination || 'default';
    console.log(destination);
  const clientId = '1080326324955-b851uhmcl7npi84eunt5od5jo0pqc1kb.apps.googleusercontent.com';
  const redirectUri = 'http://localhost:3000/auth/google/callback';
  const scope = 'email profile';
  const responseType = 'code';
  const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}&prompt=select_account`;
  res.redirect(googleOAuthUrl)
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    const code = req.query.code; 
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: '1080326324955-b851uhmcl7npi84eunt5od5jo0pqc1kb.apps.googleusercontent.com',
        client_secret: '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',
        code: code,
        redirect_uri: 'http://localhost:3000/auth/google/callback',
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange code for token: ${tokenData.error}`);
    }
    const accessToken = tokenData.access_token; 
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!userInfoResponse.ok) {
      throw new Error(`Failed to fetch user info: ${userData.error}`);
    }
    const userData = await userInfoResponse.json();
    // Generate JWT
    jwtToken = jwt.sign(userData, secretKey);
    console.log(jwtToken);
    insertUserData(userData,jwtToken);
    console.log(userData);
    res.redirect(`http://192.168.56.1:4200/${destination}`);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('An error occurred during Google OAuth login.');
  }
});

router.get('/auth/linkedin', (req, res) => {
//   destination = req.query.destination || 'default';
  destination = req.query.destination || 'default';
  const clientId = '86bxc6yrc616ep';
  const redirectUri = 'http://localhost:3000/auth/linkedin/callback';
  const scopes = 'openid email profile';
  const state = 'random'; 

  const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;
  res.redirect(linkedInAuthUrl);
});

router.get('/auth/linkedin/callback', (req, res) => {
  const clientId = '86bxc6yrc616ep';
  const clientSecret = 'MajDri5O16mwT50L';
  const redirectUri = 'http://localhost:3000/auth/linkedin/callback';
  const code = req.query.code;

  const accessTokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  const accessTokenParams = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret
  };

  fetch(accessTokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(accessTokenParams)
  })
  .then(response => response.json())
  .then(data => {
    const id_token = data.id_token;
    const decodedToken = jwt.decode(id_token);
    console.log("user Data ",decodedToken)
    insertUserData(decodedToken);
        // Generate JWT
        jwtToken = jwt.sign(decodedToken,secretKey);
        console.log(jwtToken);
        res.redirect(`http://192.168.56.1:4200/${destination}`);
  })
  .catch(error => {
    console.error('Error exchanging authorization code for access token:', error);
    res.status(500).send('Error exchanging authorization code for access token');
  });
});


function insertUserData(userData,jwtSessionToken) {
  console.log('New', userData);
  // Destructure userData here
  const { email, name, given_name, family_name, picture } = userData;
  const signupDate = new Date();
  
  // Construct the data object with only the fields you want to insert
  const data = {
    emailId: email,
    fullName: name,
    firstName: given_name,
    lastName: family_name,
    signupDate,
    imagePath: picture,
    jwtToken : jwtSessionToken
  };

  const sql = 'INSERT INTO signup_table SET ?';
  db.query(sql, data, (err, result) => {
    if (err) {
      console.error('Error inserting user data:', err);
      return;
    }
    console.log('User data inserted successfully:', result);
  });
}


router.get('/getSession', (req, res) => {
  const sql = 'SELECT jwtToken FROM signup_table';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching records:', err);
      res.status(500).json({ error: 'Error fetching records' });
    } else {
      console.log('JwtToken',results)
      return res.send({ status: true, session: results, message: 'Details Fetched Successfully' });
    }
  });   
});
  
router.get('/logout', (req, res) => {
    jwtToken = null;
    return res.send({ status: true, session: jwtToken, message: 'Logout SuccessFully' });
});

module.exports = router;