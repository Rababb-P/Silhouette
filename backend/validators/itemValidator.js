const { z } = require("zod");

// Validation schema for creating an item
const createItemSchema = z.object({
  color: z.string().min(1),
  item: z.string().min(1),
  style: z.string().min(1),
  productLink: z.string().url(),
  imageLink: z.string().url()
});

module.exports = {
  createItemSchema
};
