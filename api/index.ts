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
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A5341f Safari/604.1');
    await page.setViewport({
      width: 768,
      height: 1024,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });

    await page.goto(url, { waitUntil: 'networkidle2' });

    const screenshotBuffer = await page.screenshot();
    await browser.close();

    // Upload the screenshot to Cloudinary
    const uploadResult = await cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'screenshots' }, (error, result) => {
      if (error) {
        return res.status(500).send('An error occurred while uploading to Cloudinary.');
      }
      res.send({ url: result.secure_url });
    });

    uploadResult.end(screenshotBuffer);

  } catch (error) {
    res.status(500).send('An error occurred while taking the screenshot.');
  }
});


app.listen(3000, () => console.log('Server ready on port 3000.'));

module.exports = app;
