const { sequelize, testConnection } = require('../config/database');
const Product = require('./Product');
const SearchHistory = require('./SearchHistory');
const User = require('./User');

// Initialize all models
const models = {
  Product,
  SearchHistory: SearchHistory(sequelize),
  User: User(sequelize),
};

// Set up associations
if (models.User.associate) {
  models.User.associate(models);
}
if (models.SearchHistory.associate) {
  models.SearchHistory.associate(models);
}

// Sync database (create tables if they don't exist)
const initializeDatabase = async () => {
  try {
    await sequelize.sync({ force: false }); // Set to true to drop and recreate tables
    console.log('✅ Database tables created successfully.');
    
    // Seed database with sample data
    const { seedProducts } = require('../seeders/productSeeder');
    await seedProducts();
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  models,
  initializeDatabase,
  ...models,
}; 