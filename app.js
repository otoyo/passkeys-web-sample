import express from 'express';
import session from 'express-session';
import { JSONFilePreset } from 'lowdb/node';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

const DOMAIN = process.env.DOMAIN || 'localhost';
const PORT = process.env.PORT || '3000';

const app = express();
const port = 3000;

app.use(session({
  secret: 'use passkey!',
  resave: false,
  saveUninitialized: true,
}));

app.use(express.json());

app.set('views', 'views');
app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.render('index');
  }

  const db = await JSONFilePreset('db.json', { credentials: [], users: [] });
  const { credentials } = db.data;
  const cred = credentials.find(({ user_id }) => user_id === user.id);
  res.render('index', { currentUser: JSON.stringify(user), cred: JSON.stringify(cred) });
});

app.get('/signup', (req, res) => {
  res.render('signup', {});
});

app.get('/registrationOptions', async (req, res) => {
  const email = req.query.email;

  const options = await generateRegistrationOptions({
    rpName: 'Passkeys Web Sample',
    rpID: DOMAIN,
    userName: email,
    timeout: 300000, // 5 minutes
    excludeCredentials: [],
  });

  const user = { id: options.user.id, email };

  req.session.user = user;
  req.session.challenge = options.challenge;

  return res.json(options);
});

app.post('/signup', async (req, res) => {
  const user = req.session.user;
  const expectedChallenge = req.session.challenge;
  const expectedOrigin = DOMAIN === 'localhost' ? `http://${DOMAIN}:${PORT}` : `https://${DOMAIN}`;
  const expectedRPID = DOMAIN;
  const response = req.body;

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      requireUserPresence: true,
      requireUserVerification: false,
    });
    const { verified, registrationInfo } = verification;

    if (!verified) {
      throw new Error('User verification failed.');
    }

    const { credential, userVerified, aaguid, credentialDeviceType } = registrationInfo;
    const base64PublicKey = isoBase64URL.fromBuffer(credential.publicKey);

    const synced = credentialDeviceType === 'multiDevice';

    if (!userVerified) {
      console.log(`User was not verified. id: ${user.id}`);
    }

    const db = await JSONFilePreset('db.json', { credentials: [], users: [] });
    await db.update(({ credentials }) => {
      credentials.push({
        id: credential.id,
        publicKey: base64PublicKey,
        aaguid,
        synced,
        registered: Date.now(),
        counter: 0,
        last_used: null,
        user_id: user.id,
      });
    });
    await db.update(({ users }) => users.push(user));

    return res.json({ status: 'success'});
  } catch (err) {
    return res.status(400).send({ error: err.message });
  } finally {
    delete req.session.challenge;
  }
});

app.get('/login', (req, res) => {
  res.render('login', {});
});

app.get('/authenticationOptions', async (req, res) => {
  const options = await generateAuthenticationOptions({
    rpID: DOMAIN,
    allowCredentials: [],
    timeout: 300000, // 5 minutes
  });
  req.session.challenge = options.challenge;
  return res.json(options);
});

app.post('/login', async (req, res) => {
  const expectedChallenge = req.session.challenge;
  const expectedOrigin = DOMAIN === 'localhost' ? `http://${DOMAIN}:${PORT}` : `https://${DOMAIN}`;
  const expectedRPID = DOMAIN;

  const db = await JSONFilePreset('db.json', { credentials: [], users: [] });

  try {
    const credential = db.data.credentials.find(cred => cred.id === req.body.id);
    if (!credential) {
      throw new Error('Matching credential not found on the server.');
    }

    const user = db.data.users.find(user => user.id === credential.user_id);
    if (!user) {
      throw new Error('User not found.');
    }

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        publicKey: isoBase64URL.toBuffer(credential.publicKey),
        id: isoBase64URL.toBuffer(credential.id),
        counter: credential.counter,
      },
      requireUserVerification: false,
    });

    const { verified, authenticationInfo } = verification;

    const { userVerified } = authenticationInfo;
    if (!userVerified) {
      console.log(`User was not verified. id: ${user.id}`);
    }

    if (!verified) {
      throw new Error('User authentication failed.');
    }

    await db.update(({ credentials }) => {
      const credential = credentials.find(cred => cred.id === req.body.id);
      credential.last_used = Date.now();
      credential.counter = authenticationInfo.newCounter;
    });

    req.session.user = user;

    return res.json({ status: 'success'});
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  } finally {
    delete req.session.challenge;
  }
});

app.get('/logout', (req, res) => {
  delete req.session.user;
  res.redirect('/');
});

app.listen(Number(PORT), () => {
  console.log(`Server running on port ${port}`);
});