require("dotenv").config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ mssg: 'Welcome to the app' });
});

// Media routes
app.use('/api', require('./routes/media'));

// Style analysis routes
app.use('/api', require('./routes/style'));

// Items routes
app.use('/items', require('./routes/items'));

// Start server
(async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 3000;
    app.listen(port, () =>
      console.log(`Server running on http://localhost:${port}`)
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
