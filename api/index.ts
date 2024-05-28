import express from 'express';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();


const app = express();

const bodyParser = require('body-parser');
const path = require('path');

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const SCREENSHOT_PATH = '/tmp/screenshot.png';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, '..', 'components', 'home.htm'));
});

app.get('/about', function (req, res) {
	res.sendFile(path.join(__dirname, '..', 'components', 'about.htm'));
});


// Route to handle screenshot creation and upload
app.post('/api/screenshot', upload.none(), async (req, res) => {
  
const { password, url } = req.body;
  const validPassword = process.env.PASSWORD;

  if (password !== validPassword) {
    return res.status(401).send('Unauthorized: Invalid password.');
  }

  if (!url) {
    return res.status(400).send('Bad Request: URL is required.');
  }

  try {
    const apiKey = process.env.APIFY_API_KEY;
    const screenshotUrl = `https://api.apify.com/v2/browser-info/screenshot?token=${apiKey}&url=${encodeURIComponent(url)}&device=Apple-iPad-Pro-2018-12.9`;

    const response = await axios.get(screenshotUrl, {
      responseType: 'arraybuffer',
    });

    const screenshotBuffer = Buffer.from(response.data, 'binary');

    // Upload screenshot to Cloudinary
    const result = await cloudinary.uploader.upload(`data:image/png;base64,${screenshotBuffer.toString('base64')}`, {
      folder: 'screenshots',
      use_filename: true,
      overwrite: true,
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
	
});


app.listen(3000, () => console.log('Server ready on port 3000.'));

module.exports = app;
