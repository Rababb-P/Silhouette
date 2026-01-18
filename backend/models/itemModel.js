const mongoose = require("mongoose");

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

module.exports = Item;
