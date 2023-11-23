// app.js

const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const paymentRoutes = require('./paymentRoutes');
const usersRoutes = require('./UserRoutes');
const loginRoutes = require('./loginRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Replace '*' with your specific origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


// MongoDB connection URL
const mongoURL = 'mongodb+srv://kalyanvision381:uykt2riskUeq2LIj@cluster0.9wscwrp.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'VisionKalyan_New';
const client = new MongoClient(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/generate-epins', async (req, res) => {
    try {
      const { userId, count } = req.body;
  
      // Generate unique E-pins
      const generatedPins = [];
      while (generatedPins.length < count) {
        const newPin = Math.random().toString(36).substring(2, 10).toUpperCase();
        if (generatedPins.indexOf(newPin) === -1) {
          generatedPins.push(newPin);
        }
      }
  
      // Connect to MongoDB
      const client = await MongoClient.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
      db = client.db(dbName);
  
      // Update or insert E-pins without checking if the user already has an E-pin
      await db.collection('epins').updateOne(
        { userId },
        { $addToSet: { pins: { $each: generatedPins } } },
        { upsert: true } // Create a new document if it doesn't exist
      );
        
      client.close();
      res.json({ success: true, epins: generatedPins });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

//
app.get('/epins/:username', async (req, res) => {
    try {
      const username = req.params.username;
      // Connect to MongoDB
      const client = await MongoClient.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
      const db = client.db(dbName);
      // Find E-pins for the given username
      const result = await db.collection('epins').findOne({ userId: username });
      client.close();
      if (result) {
        res.json({ success: true, epins: result.pins });
      } else {
        res.status(404).json({ success: false, message: 'E-pins not found for the specified user' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });
//
app.get('/all-epins', async (req, res) => {
    try {
      // Connect to MongoDB
      const client = await MongoClient.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
      const db = client.db(dbName);
      // Find all E-pins
      const results = await db.collection('epins').find().toArray();
      client.close();
      res.json({ success: true, allEpins: results });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

app.use('/users',usersRoutes);
app.use('/payments', paymentRoutes);
app.use('/users', loginRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
