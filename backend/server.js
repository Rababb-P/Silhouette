// server.js
require("dotenv").config();

const express = require('express')
const cors = require('cors')
const multer = require('multer')
const cors = require('cors')
const fs = require('fs')
const mongoose = require("mongoose");
const { z } = require("zod");
const { File } = require('file-api')
const { RealtimeVision } = require('@overshoot/sdk')

const app = express();

app.use(cors())
app.use(express.json())

// Configure multer for video upload
const upload = multer({ dest: 'uploads/' })

//middleware
app.use(cors())
app.use(express.json())

//routes
app.get('/', (req, res) => {
    res.json({mssg: 'Welcome to the app'})
})

// Media routes
app.use('/api', require('./routes/media'))

// listen for requests
app.listen(process.env.PORT, () => {
    console.log('listening on port ', process.env.PORT )
})
app.post('/api/analyze-style', upload.single('video'), async (req, res) => {
    try {
        console.log('Received analyze request')
        if (!req.file) {
            console.log('No file provided')
            return res.status(400).json({ error: 'No video file provided' })
        }

        const videoPath = req.file.path
        console.log('Video file path:', videoPath)
        const buffer = fs.readFileSync(videoPath)
        const videoFile = new File([buffer], req.file.originalname, { type: req.file.mimetype })

        const results = []

        console.log('Creating RealtimeVision...')
        const vision = new RealtimeVision({
            apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
            apiKey: process.env.OVERSHOOT_API_KEY,
            prompt: 'Analyze the person\'s style and body type. Output a JSON object with exactly three properties: "colour" (string), "style" (one of: baggy, active, formal), "item" (one of: bottoms, tops, etc). Choose appropriate values based on what you see.',
            source: { type: 'video', file: videoFile },
            onResult: (result) => {
                console.log('Received result:', result)
                results.push(result.result)
            }
        })

        console.log('Starting vision...')
        await vision.start()
        console.log('Vision started, waiting 5 seconds...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log('Stopping vision...')
        await vision.stop()
        console.log('Vision stopped, results:', results)

        const finalResult = results[results.length - 1] || 'No results'
        console.log('Final result:', finalResult)

        res.json({ text: finalResult })
    } catch (error) {
        console.error('Analysis error:', error.message)
        console.error('Stack:', error.stack)
        res.status(500).json({ error: 'Analysis failed', details: error.message })
    }
})

// MongoDB connection
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas");
}

// Mongoose schema (ONLY required fields)
const ItemSchema = new mongoose.Schema(
  {
    color: { type: String, required: true, trim: true },
    item: { type: String, required: true, trim: true },
    style: { type: String, required: true, trim: true },
    productLink: { type: String, required: true, trim: true },
    imageLink: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const Item = mongoose.model("Item", ItemSchema);

// validation
const createItemSchema = z.object({
  color: z.string().min(1),
  item: z.string().min(1),
  style: z.string().min(1),
  productLink: z.string().url(),
  imageLink: z.string().url()
});

// health check
app.get("/", (req, res) => {
  res.json({ ok: true });
});

// create item (JSON body)
app.post("/items", async (req, res) => {
  try {
    const parsed = createItemSchema.parse(req.body);
    const saved = await Item.create(parsed);
    res.status(201).json(saved);
  } catch (err) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: "Server error", details: String(err) });
  }
});

// list items
app.get("/items", async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 });
  res.json(items);
});

// get one by id
app.get("/items/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

// delete one
app.delete("/items/:id", async (req, res) => {
  try {
    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

// start server
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
