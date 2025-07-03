const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /api/products - Fetch all products
router.get('/', productController.getAllProducts);

// GET /api/products/:id - Fetch a single product by ID
router.get('/:id', productController.getProductById);


module.exports = router; 