const Item = require('../models/itemModel');
const { createItemSchema } = require('../validators/itemValidator');

// Create item (JSON body)
const createItem = async (req, res) => {
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
};

// List items
const getItems = async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 });
  res.json(items);
};

// Get one by id
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
};

// Delete one
const deleteItem = async (req, res) => {
  try {
    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  deleteItem
};
