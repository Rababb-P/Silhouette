const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Create item (JSON body)
router.post('/', itemController.createItem);

// List items
router.get('/', itemController.getItems);

// Get one by id
router.get('/:id', itemController.getItemById);

// Delete one
router.delete('/:id', itemController.deleteItem);

module.exports = router;
