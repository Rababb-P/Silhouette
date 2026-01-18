require("dotenv").config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// Middleware
app.use(cors());
// Increase body size limit to handle large base64 images (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get('/', (req, res) => {
  res.json({ mssg: 'Welcome to the app' });
});

// Media routes
app.use('/api', require('./routes/media'));

// Style analysis routes
app.use('/api', require('./routes/style'));

// Capture routes
app.use('/api', require('./routes/capture'));

// Preferences routes
app.use('/api', require('./routes/preferences'));

// Recommendation routes
app.use('/api', require('./routes/recommendations'));

// Items routes
app.use('/items', require('./routes/items'));

// Serve static files for captures
app.use('/captures', express.static('captures'));

// Start server
(async () => {
  try {
    // Try to connect to database, but don't fail if it's not configured
    const uri = process.env.MONGODB_URI;
    if (uri) {
      try {
        await connectDB();
        console.log('✅ Connected to MongoDB');
      } catch (dbError) {
        console.warn('⚠️  MongoDB connection failed (continuing anyway):', dbError.message);
        console.warn('⚠️  Server will run but database features may not work');
      }
    } else {
      console.log('ℹ️  No MONGODB_URI configured - running without database');
      console.log('ℹ️  Filesystem-based storage (captures/preferences) will still work');
    }
    
    const port = process.env.PORT || 3000;
    app.listen(port, () =>
      console.log(`✅ Server running on http://localhost:${port}`)
    );
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
})();
