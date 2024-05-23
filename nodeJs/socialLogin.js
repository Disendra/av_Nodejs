require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('./dbConnection');
const fetch = require('node-fetch2');
const crypto = require('crypto');
const cors = require('cors');

router.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
const secretKey = crypto.randomBytes(32).toString('hex');
router.use(passport.initialize());
router.use(passport.session());
router.use(cors());

let jwtToken;
let destination;
let userEmailId;
let url = 'https://disendra-avproject.netlify.app/redirected-page/redirected-page';
let googleRedirectUrl = 'https://av-nodejs.onrender.com/auth/google/callback'
let linkedinRedirectUrl = 'https://av-nodejs.onrender.com/auth/linkedin/callback';
let facebookRedirectUrl = 'https://av-nodejs.onrender.com/auth/facebook/callback';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

router.get('/auth/google', (req, res) => {
  destination = req.query.destination || 'default';
  console.log(destination);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = googleRedirectUrl;
  const scope = 'email profile';
  const responseType = 'code';
  const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${responseType}&prompt=select_account`;
  res.redirect(googleOAuthUrl);
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
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        redirect_uri: googleRedirectUrl,
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
    jwtToken = jwt.sign(userData, secretKey);
    console.log(jwtToken);
    insertUserData(userData, jwtToken);
    console.log(userData);
    res.redirect(`${url}/${destination}`);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('An error occurred during Google OAuth login.');
  }
});

router.get('/auth/linkedin', (req, res) => {
  destination = req.query.destination || 'default';
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = linkedinRedirectUrl;
  const scopes = 'openid email profile';
  const state = 'random';

  const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;
  res.redirect(linkedInAuthUrl);
});

router.get('/auth/linkedin/callback', (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = linkedinRedirectUrl;
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
    console.log("user Data ", decodedToken);
    insertUserData(decodedToken);
    jwtToken = jwt.sign(decodedToken, secretKey);
    console.log(jwtToken);
    res.redirect(`${url}/${destination}`);
  })
  .catch(error => {
    console.error('Error exchanging authorization code for access token:', error);
    res.status(500).send('Error exchanging authorization code for access token');
  });
});


router.get('/auth/facebook', (req, res) => {
  destination = req.query.destination || 'default';
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const redirectUri = facebookRedirectUrl;
  const scopes = 'email public_profile';
  const state = 'random';

  const facebookAuthUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;
  res.redirect(facebookAuthUrl);
});

router.get('/auth/facebook/callback', (req, res) => {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const redirectUri = facebookRedirectUrl;
  const code = req.query.code;

  const accessTokenUrl = `https://graph.facebook.com/v12.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;

  fetch(accessTokenUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error fetching access token: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      const accessToken = data.access_token;
      console.log('Access Token:', accessToken);
      if (!accessToken) {
        throw new Error('Access token not returned');
      }
      const userProfileUrl = `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,first_name,last_name,email,picture`;
      return fetch(userProfileUrl);
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error fetching user profile: ${response.statusText}`);
      }
      return response.json();
    })
    .then(profile => {
      console.log('User Profile:', profile);
      if (!profile.email) {
        throw new Error('Email not provided by Facebook');
      }
      let modifiedProfile = {
        name: profile.name,
        given_name : profile.first_name,
        family_name : profile.last_name,
        email: profile.email,
        picture: profile.picture?.data?.url || null
      };
      console.log('modifiedProfile', modifiedProfile)
      insertUserData(modifiedProfile);
      const jwtToken = jwt.sign(profile, secretKey);
      console.log('JWT Token:', jwtToken);
      res.redirect(`${url}/${destination}`);
    })
    .catch(error => {
      console.error('Error in OAuth flow:', error.message);
      res.status(500).send('Error in OAuth flow');
    });
});


function insertUserData(userData, jwtSessionToken) {
  console.log('New', userData);
  const { email, name, given_name, family_name, picture } = userData;
  userEmailId = email;
  const signupDate = new Date();
  const data = {
    fullName: name,
    firstName: given_name,
    lastName: family_name,
    signupDate,
    imagePath: picture,
    jwtToken: jwtSessionToken
  };

  const sql = `
    INSERT INTO signup_table 
      (emailId, fullName, firstName, lastName, signupDate, imagePath, jwtToken) 
    VALUES 
      (?, ?, ?, ?, ?, ?, ?) 
    ON DUPLICATE KEY UPDATE 
      fullName = VALUES(fullName), 
      firstName = VALUES(firstName), 
      lastName = VALUES(lastName), 
      signupDate = VALUES(signupDate), 
      imagePath = VALUES(imagePath), 
      jwtToken = VALUES(jwtToken)
  `;
  const values = [email, data.fullName, data.firstName, data.lastName, data.signupDate, data.imagePath, data.jwtToken];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting or updating user data:', err);
      return;
    }
    console.log('User data inserted or updated successfully:', result);
  });
}

router.get('/getSession', (req, res) => {
  emailId = userEmailId;
  const sql = 'SELECT emailId,firstName,jwtToken FROM signup_table WHERE emailId = ?';
  db.query(sql, [userEmailId], (err, results) => {
    if (err) {
      console.error('Error fetching records:', err);
      res.status(500).json({ error: 'Error fetching records' });
    } else {
      console.log('JwtToken', results);
      return res.send({ status: true, session: results, message: 'Details Fetched Successfully' });
    }
  });
});

module.exports = router;
