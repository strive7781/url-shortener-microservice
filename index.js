require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');

const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// mongodb configuration
const mongoURL = process.env.MONGODB_URI;
const client = new MongoClient(mongoURL);
const dbName = 'urlshortener';

async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
  }
}
connect();

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: "hello API" });
});

// actual project endpoints
app.post('/api/shorturl', async (req, res) => {
  const url = req.body['url'];

  const httpRegex = /^(http|https)(:\/\/)/;
  
  if (!httpRegex.test(url)) {
    return res.json({ error: "Invalid URL" })
  }

  const db = client.db(dbName);
  const urls = db.collection('urls');

  try {
    const urlCount = await urls.countDocuments({});
    const urlDoc = { url: url, short_url: urlCount };
    await urls.insertOne(urlDoc);
    return res.json({ original_url: url, short_url: urlCount });
  } catch (err) {
    console.error(err);
    return res.json({ error: "Something went wrong" });
  }
});

app.get('/api/shorturl/:shorturl', async (req, res) => {
  const shorturl = parseInt(req.params.shorturl);
  const db = client.db(dbName);
  const urls = db.collection('urls');

  try {
    const urlDoc = await urls.findOne({ short_url: shorturl });
    if (!urlDoc) {
      return res.json({ error: "No short URL found for the given input" });
    }
    res.redirect(urlDoc.url);
  } catch (err) {
    console.error(err);
    return res.json({ error: "Something went wrong" });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});