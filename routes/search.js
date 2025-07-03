const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// POST /api/search - AI-powered product search
router.post('/', searchController.search);

// GET /api/search/health - Check LLM service health status
router.get('/health', searchController.healthCheck);

// GET /api/search/history - Get search history
router.get('/history', searchController.getHistory);

// GET /api/search/popular - Get popular search terms
router.get('/popular', searchController.getPopularSearches);

module.exports = router; 