const productService = require('../services/productService');

const productController = {
  // GET /api/products
  getAllProducts: async (req, res) => {
    try {
      const { category, minPrice, maxPrice, brand, sortBy } = req.query;
      const filters = {};
      
      if (category) filters.category = category;
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (brand) filters.brand = brand;

      let products = await productService.getAllProducts(filters);
      
      // Apply sorting if requested
      if (sortBy) {
        products = productController._applySorting(products, sortBy);
      }
      
      res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // GET /api/products/:id
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // POST /api/products
  createProduct: async (req, res) => {
    try {
      const productData = req.body;
      const newProduct = await productService.createProduct(productData);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: newProduct
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // PUT /api/products/:id
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedProduct = await productService.updateProduct(id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  // DELETE /api/products/:id
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedProduct = await productService.deleteProduct(id);
      
      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
        data: deletedProduct
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // GET /api/products/category/:category
  getProductsByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      const products = await productService.getProductsByCategory(category);
      
      res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // GET /api/products/search?q=searchTerm
  searchProducts: async (req, res) => {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const products = await productService.searchProducts(searchTerm);
      
      res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  _applySorting: (products, sortBy) => {
    switch (sortBy) {
      case 'price_asc':
        return products.sort((a, b) => a.price - b.price);
      
      case 'price_desc':
        return products.sort((a, b) => b.price - a.price);
      
      case 'name_asc':
        return products.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'name_desc':
        return products.sort((a, b) => b.name.localeCompare(a.name));
      
      case 'newest':
        return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      case 'oldest':
        return products.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      case 'relevance':
      default:
        return products.sort((a, b) => (b.ai_relevance_score || 0) - (a.ai_relevance_score || 0));
    }
  }
};

module.exports = productController; 