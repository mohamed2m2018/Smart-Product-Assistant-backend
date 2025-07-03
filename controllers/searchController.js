const productService = require('../services/productService');
const llmService = require('../services/llmService');
const searchHistoryService = require('../services/searchHistoryService');

const searchController = {
  // POST /api/search - AI-powered product search with enhanced error handling
  search: async (req, res) => {
    const startTime = Date.now();
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userId = req.session?.userId || null;
    
    try {
      const { 
        query, 
        filters = {}, 
        sortBy = 'relevance',
        page = 1,
        limit = 10
      } = req.body;

      // Enhanced input validation
      if (!query) {
        await searchHistoryService.recordSearch({
          query: 'MISSING_QUERY',
          success: false,
          errorType: 'MISSING_QUERY',
          executionTimeMs: Date.now() - startTime,
          userAgent,
          ipAddress
        });

        return res.status(400).json({
          success: false,
          error: 'MISSING_QUERY',
          message: 'Search query is required'
        });
      }

      if (typeof query !== 'string') {
        await searchHistoryService.recordSearch({
          query: String(query),
          success: false,
          errorType: 'INVALID_QUERY_TYPE',
          executionTimeMs: Date.now() - startTime,
          userAgent,
          ipAddress,
          userId: userId
        });

        return res.status(400).json({
          success: false,
          error: 'INVALID_QUERY_TYPE',
          message: 'Query must be a string'
        });
      }

      if (query.trim().length === 0) {
        await searchHistoryService.recordSearch({
          query: query,
          success: false,
          errorType: 'EMPTY_QUERY',
          executionTimeMs: Date.now() - startTime,
          userAgent,
          ipAddress,
          userId: userId
        });

        return res.status(400).json({
          success: false,
          error: 'EMPTY_QUERY',
          message: 'Query cannot be empty'
        });
      }

      if (query.length > 500) {
        await searchHistoryService.recordSearch({
          query: query.substring(0, 100) + '...',
          success: false,
          errorType: 'QUERY_TOO_LONG',
          executionTimeMs: Date.now() - startTime,
          userAgent,
          ipAddress,
          userId: userId
        });

        return res.status(400).json({
          success: false,
          error: 'QUERY_TOO_LONG',
          message: 'Query must be less than 500 characters'
        });
      }

      console.log(`🔍 Search Request - User: ${userId || 'anonymous'}, Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}", Filters:`, filters, `Sort: ${sortBy}`);

      // Fetch ALL products from the database
      let allProducts = await productService.getAllProducts();

      if (!allProducts || allProducts.length === 0) {
        await searchHistoryService.recordSearch({
          query: query.trim(),
          success: false,
          errorType: 'NO_PRODUCTS',
          executionTimeMs: Date.now() - startTime,
          userAgent,
          ipAddress,
          filters,
          sortBy,
          userId: userId
        });

        return res.status(404).json({
          success: false,
          error: 'NO_PRODUCTS',
          message: 'No products available in the database'
        });
      }

      // Apply filters to products before sending to LLM
      allProducts = searchController._applyFilters(allProducts, filters);

      // Pass the user query and filtered products to the llmService
      const recommendations = await llmService.getProductRecommendations(query, allProducts);

      // Handle case where no recommendations are found
      if (!recommendations || recommendations.length === 0) {
        const executionTime = Date.now() - startTime;
        console.log(`📭 Search Complete - No matches found, Time: ${executionTime}ms`);
        
        await searchHistoryService.recordSearch({
          query: query.trim(),
          resultsCount: 0,
          success: true,
          executionTimeMs: executionTime,
          userAgent,
          ipAddress,
          filters,
          sortBy,
          userId: userId
        });

        return res.status(200).json({
          success: true,
          query: query.trim(),
          results: [],
          filters: filters,
          sortBy: sortBy,
          pagination: {
            page: 1,
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          },
          message: 'No products match your search criteria. Try different keywords or broaden your search.',
          execution_time_ms: executionTime
        });
      }

      // Fetch the full product details for recommended IDs from database
      const enrichedProducts = [];
      for (const recommendation of recommendations) {
        try {
          const product = await productService.getProductById(recommendation.id);
          if (product) {
            enrichedProducts.push({
              ...product.toJSON(),
              ai_explanation: recommendation.explanation,
              ai_relevance_score: recommendation.relevance_score
            });
          } else {
            console.warn(`⚠️ Product ${recommendation.id} not found in database`);
          }
        } catch (dbError) {
          console.error(`❌ Database error fetching product ${recommendation.id}:`, dbError.message);
        }
      }

      // Apply sorting to the enriched results
      const sortedProducts = searchController._applySorting(enrichedProducts, sortBy);

      // Apply pagination
      const paginatedResults = searchController._applyPagination(sortedProducts, page, limit);

      const executionTime = Date.now() - startTime;
      console.log(`✅ Search Complete - Found ${enrichedProducts.length} products, Time: ${executionTime}ms`);

      // Record successful search in history
      await searchHistoryService.recordSearch({
        query: query.trim(),
        resultsCount: enrichedProducts.length,
        success: true,
        executionTimeMs: executionTime,
        userAgent,
        ipAddress,
        filters,
        sortBy,
        userId: userId
      });

      // Return the enriched and processed results
      res.status(200).json({
        success: true,
        query: query.trim(),
        results: paginatedResults.data,
        filters: filters,
        sortBy: sortBy,
        pagination: paginatedResults.pagination,
        total_results: enrichedProducts.length,
        execution_time_ms: executionTime
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Search Error - Time: ${executionTime}ms, Error:`, error.message);
      
      // Record failed search in history
      try {
        await searchHistoryService.recordSearch({
          query: req.body.query || 'UNKNOWN',
          success: false,
          errorType: error.name === 'LLMServiceError' ? error.type : 'UNKNOWN_ERROR',
          executionTimeMs: executionTime,
          userAgent,
          ipAddress,
          filters: req.body.filters || {},
          sortBy: req.body.sortBy || null,
          userId: userId
        });
      } catch (historyError) {
        console.error('Failed to record search history:', historyError.message);
      }
      
      // Handle specific LLMServiceError types with appropriate HTTP status codes
      if (error.name === 'LLMServiceError') {
        switch (error.type) {
          case 'VALIDATION_ERROR':
            return res.status(400).json({
              success: false,
              error: 'VALIDATION_ERROR',
              message: 'Invalid search request',
              details: error.message,
              execution_time_ms: executionTime
            });

          case 'CONFIGURATION_ERROR':
            return res.status(503).json({
              success: false,
              error: 'SERVICE_UNAVAILABLE',
              message: 'Search service is temporarily unavailable due to configuration issues',
              execution_time_ms: executionTime
            });

          case 'RATE_LIMIT_ERROR':
            return res.status(429).json({
              success: false,
              error: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again in a moment.',
              retry_after: 60,
              execution_time_ms: executionTime
            });

          case 'QUOTA_ERROR':
            return res.status(503).json({
              success: false,
              error: 'SERVICE_QUOTA_EXCEEDED',
              message: 'Search service is temporarily unavailable due to quota limitations',
              execution_time_ms: executionTime
            });

          case 'TIMEOUT_ERROR':
            return res.status(504).json({
              success: false,
              error: 'SEARCH_TIMEOUT',
              message: 'Search request timed out. Please try again with a simpler query.',
              execution_time_ms: executionTime
            });

          case 'RESPONSE_ERROR':
            return res.status(502).json({
              success: false,
              error: 'INVALID_AI_RESPONSE',
              message: 'Search service returned an invalid response. Please try again.',
              execution_time_ms: executionTime
            });

          case 'API_ERROR':
          default:
            return res.status(500).json({
              success: false,
              error: 'AI_SERVICE_ERROR',
              message: 'Search service encountered an error. Please try again.',
              execution_time_ms: executionTime
            });
        }
      }

      // Handle database errors
      if (error.name === 'SequelizeError' || error.message?.includes('database')) {
        return res.status(500).json({
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Database error occurred while searching products',
          execution_time_ms: executionTime
        });
      }

      // Handle generic errors
      res.status(500).json({
        success: false,
        error: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during search',
        execution_time_ms: executionTime
      });
    }
  },

  // GET /api/search/health - Check LLM service health status
  healthCheck: async (req, res) => {
    const startTime = Date.now();
    
    try {
      console.log('🩺 Running LLM health check...');
      
      const isHealthy = await llmService.testConnection();
      const executionTime = Date.now() - startTime;
      
      if (isHealthy) {
        res.status(200).json({
          success: true,
          status: 'healthy',
          message: 'LLM service is working correctly',
          execution_time_ms: executionTime,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          success: false,
          status: 'unhealthy',
          message: 'LLM service is not responding correctly',
          execution_time_ms: executionTime,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Health check failed - Time: ${executionTime}ms, Error:`, error.message);
      
      res.status(503).json({
        success: false,
        status: 'error',
        message: 'Health check failed',
        error: error.message,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      });
    }
  },

  // GET /api/search/history - Get search history
  getHistory: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        successOnly = false,
        query = null,
        startDate = null,
        endDate = null
      } = req.query;

      const userId = req.session?.userId || null;
      console.log(`📚 Fetching search history for user: ${userId || 'anonymous'}`);

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        successOnly: successOnly === 'true',
        query,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId: userId // User-specific filtering - null for anonymous users
      };

      const history = await searchHistoryService.getSearchHistory(options);

      console.log(`📊 Found ${history.data.length} search history items for user ${userId || 'anonymous'}`);

      res.status(200).json({
        success: true,
        ...history,
        userSpecific: userId !== null, // Indicate if results are user-specific
        currentUser: userId
      });
    } catch (error) {
      console.error('Error fetching search history:', error);
      res.status(500).json({
        success: false,
        error: 'HISTORY_FETCH_ERROR',
        message: 'Failed to fetch search history'
      });
    }
  },

  // GET /api/search/popular - Get popular search terms
  getPopularSearches: async (req, res) => {
    try {
      const { limit = 10, days = 30 } = req.query;
      const userId = req.session?.userId || null;
      
      console.log(`🔥 Fetching popular searches for user: ${userId || 'anonymous'} (${days} days, limit: ${limit})`);
      
      const popularSearches = await searchHistoryService.getPopularSearches(
        parseInt(limit),
        parseInt(days),
        userId // User-specific filtering - null shows global trends for anonymous users
      );

      console.log(`📈 Found ${popularSearches.length} popular searches for user ${userId || 'anonymous'}`);

      res.status(200).json({
        success: true,
        data: popularSearches,
        period: `${days} days`,
        limit: parseInt(limit),
        userSpecific: userId !== null, // Indicate if results are user-specific
        currentUser: userId
      });
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      res.status(500).json({
        success: false,
        error: 'POPULAR_SEARCHES_ERROR',
        message: 'Failed to fetch popular searches'
      });
    }
  },

  // Private helper methods
  _applyFilters: (products, filters) => {
    let filteredProducts = products;

    // Filter by category
    if (filters.category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Filter by price range
    if (filters.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => 
        product.price >= parseFloat(filters.minPrice)
      );
    }

    if (filters.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => 
        product.price <= parseFloat(filters.maxPrice)
      );
    }

    // Filter by brand
    if (filters.brand) {
      filteredProducts = filteredProducts.filter(product => 
        product.attributes?.brand?.toLowerCase() === filters.brand.toLowerCase()
      );
    }

    // Filter by attributes (generic)
    if (filters.attributes && typeof filters.attributes === 'object') {
      filteredProducts = filteredProducts.filter(product => {
        for (const [key, value] of Object.entries(filters.attributes)) {
          if (product.attributes?.[key]?.toLowerCase() !== value.toLowerCase()) {
            return false;
          }
        }
        return true;
      });
    }

    return filteredProducts;
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
  },

  _applyPagination: (items, page, limit) => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      data: paginatedItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }
};

module.exports = searchController; 