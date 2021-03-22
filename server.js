const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const SpotifyWebApi = require('spotify-web-api-node');
const lyricsFinder = require('lyrics-finder');

dotenv.config({ path: './config.env' });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/refresh', (req, res) => {
  const refreshToken = req.body.refreshToken;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken,
  });

  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      console.log(data);
      res.json({
        acessToken: data.body.accessToken,
        expiresIn: data.body.expiresIn,
      });
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(400);
    });
});

app.post('/login', async (req, res) => {
  const code = req.body.code;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    res.status(200).json({
      status: 'success',
      data: {
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: 'error',
      err,
    });
  }
});

app.get('/lyrics', async (req, res) => {
  const lyrics =
    (await lyricsFinder(req.query.artist, req.query.track)) ||
    'No lyrics found.';

  res.status(200).json({
    status: 'success',
    data: {
      lyrics,
    },
  });
});

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`App is running on ${port}...`);
});

process.on('SIGTERM', () => {
  console.log(
    'SIGTERM received, shutting down gracefully. All impending requests will be processed before shutdown.'
  );
  server.close(() => {
    console.log('Process terminated.');
  });
});
