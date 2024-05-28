require('dotenv').config();

const express = require('express');
const multer = require('multer');
const puppeteer = require('puppeteer');
const cloudinary = require('cloudinary').v2;

const app = express();


const bodyParser = require('body-parser');
const path = require('path');

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

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



// Multer middleware for handling multipart/form-data
const upload = multer();
const SCREENSHOT_PATH = '/tmp/screenshot.png';
// Route to handle screenshot creation and upload
app.post('/api/screenshot', upload.none(), async (req, res) => {
  const { url, password } = req.body;

  const app_password = process.env.APPPASSWORD
  // Check for password
  if (password !== app_password) {
    return res.status(401).send('Unauthorized: Invalid password.');
  }

  if (!url) {
    return res.status(400).send('Please provide a URL.');
  }

  try {
     // Launch Puppeteer with new headless mode
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.setViewport({ width: 768, height: 1024, isMobile: true });
    await page.screenshot({ path: SCREENSHOT_PATH });
    await browser.close();

    // Upload screenshot to Cloudinary
    const result = await cloudinary.uploader.upload(SCREENSHOT_PATH, {
      folder: 'screenshots',
      use_filename: true,
      overwrite: true,
      notification_url: 'https://mysite.example.com/notify_endpoint'
    });

    // Return the URL of the uploaded screenshot
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.listen(3000, () => console.log('Server ready on port 3000.'));

module.exports = app;
