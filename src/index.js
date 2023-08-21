const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')

// Endpoint 1: Total Recovered
app.get('/totalRecovered', async (req, res) => {
    const result = await connection.aggregate([
      {
        $group: {
          _id: 'total',
          recovered: { $sum: '$recovered' },
        },
      },
    ]);
    res.json({ data: result[0] });
  });
  
  // Endpoint 2: Total Active
  app.get('/totalActive', async (req, res) => {
    const result = await connection.aggregate([
      {
        $group: {
          _id: 'total',
          active: {
            $sum: { $subtract: ['$infected', '$recovered'] },
          },
        },
      },
    ]);
    res.json({ data: result[0] });
  });
  
  // Endpoint 3: Total Death
  app.get('/totalDeath', async (req, res) => {
    const result = await connection.aggregate([
      {
        $group: {
          _id: 'total',
          death: { $sum: '$death' },
        },
      },
    ]);
    res.json({ data: result[0] });
  });
  
  // Endpoint 4: Hotspot States
  app.get('/hotspotStates', async (req, res) => {
    const result = await connection.aggregate([
      {
        $addFields: {
          rate: {
            $round: [
              {
                $divide: [
                  { $subtract: ['$infected', '$recovered'] },
                  '$infected',
                ],
              },
              5, // Round to 5 decimal places
            ],
          },
        },
      },
      {
        $match: {
          rate: { $gt: 0.1 }, // Filter states with rate > 0.1
        },
      },
      {
        $project: {
          _id: 0,
          state: 1,
          rate: 1,
        },
      },
    ]);
    res.json({ data: result });
  });
  
  // Endpoint 5: Healthy States
  app.get('/healthyStates', async (req, res) => {
    const result = await connection.aggregate([
      {
        $addFields: {
          mortality: {
            $round: [
              {
                $divide: ['$death', '$infected'],
              },
              5, // Round to 5 decimal places
            ],
          },
        },
      },
      {
        $match: {
          mortality: { $lt: 0.005 }, // Filter states with mortality < 0.005
        },
      },
      {
        $project: {
          _id: 0,
          state: 1,
          mortality: 1,
        },
      },
    ]);
    res.json({ data: result });
  });
  



app.use(bodyParser.json())
app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;