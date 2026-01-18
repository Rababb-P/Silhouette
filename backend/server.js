// server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const helmet = require("helmet");
const { z } = require("zod");

const app = express();

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

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
