const { Product } = require('../models');
const { Op } = require('sequelize');

const productService = {
  // Get all products with optional filtering
  getAllProducts: async (filters = {}) => {
    try {
      const whereClause = {};
      
      // Apply filters if provided
      if (filters.category) {
        whereClause.category = filters.category;
      }
      
      if (filters.minPrice) {
        whereClause.price = { ...whereClause.price, [Op.gte]: filters.minPrice };
      }
      
      if (filters.maxPrice) {
        whereClause.price = { ...whereClause.price, [Op.lte]: filters.maxPrice };
      }

      // Filter by brand (stored in attributes.brand)
      if (filters.brand) {
        whereClause.attributes = {
          ...whereClause.attributes,
          brand: filters.brand
        };
      }

      const products = await Product.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
      });
      
      return products;
    } catch (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      const product = await Product.findByPk(id);
      return product;
    } catch (error) {
      throw new Error(`Error fetching product: ${error.message}`);
    }
  },

  // Create new product
  createProduct: async (productData) => {
    try {
      // Validate required fields
      if (!productData.name || !productData.price || !productData.category) {
        throw new Error('Name, price, and category are required');
      }

      const newProduct = await Product.create(productData);
      return newProduct;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw new Error(`Error creating product: ${error.message}`);
    }
  },

  // Update product
  updateProduct: async (id, updateData) => {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      const [updatedRowsCount] = await Product.update(updateData, {
        where: { id },
        returning: true,
      });

      if (updatedRowsCount === 0) {
        throw new Error('Product not found');
      }

      const updatedProduct = await Product.findByPk(id);
      return updatedProduct;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw new Error(`Error updating product: ${error.message}`);
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }

      const product = await Product.findByPk(id);
      if (!product) {
        throw new Error('Product not found');
      }

      await Product.destroy({ where: { id } });
      return product;
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  },

  // Get products by category
  getProductsByCategory: async (category) => {
    try {
      if (!category) {
        throw new Error('Category is required');
      }

      const products = await Product.findAll({
        where: { category },
        order: [['createdAt', 'DESC']],
      });
      
      return products;
    } catch (error) {
      throw new Error(`Error fetching products by category: ${error.message}`);
    }
  },

  // Search products by name
  searchProducts: async (searchTerm) => {
    try {
      if (!searchTerm) {
        throw new Error('Search term is required');
      }

      const products = await Product.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        order: [['createdAt', 'DESC']],
      });
      
      return products;
    } catch (error) {
      throw new Error(`Error searching products: ${error.message}`);
    }
  }
};

module.exports = productService; 