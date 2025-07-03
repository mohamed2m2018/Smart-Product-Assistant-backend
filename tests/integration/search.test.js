const request = require('supertest');
const express = require('express');
const searchRouter = require('../../routes/search');

// Mock dependencies
jest.mock('../../services/productService');
jest.mock('../../services/llmService');
jest.mock('../../services/searchHistoryService');

const productService = require('../../services/productService');
const llmService = require('../../services/llmService');
const searchHistoryService = require('../../services/searchHistoryService');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/search', searchRouter);

describe('Search Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/search', () => {
    const mockProducts = [
      {
        id: 1,
        name: 'MacBook Pro 14-inch',
        description: 'Professional laptop with M3 chip',
        price: 1999.99,
        category: 'Electronics',
        attributes: { brand: 'Apple', processor: 'M3' },
        toJSON: () => ({
          id: 1,
          name: 'MacBook Pro 14-inch',
          description: 'Professional laptop with M3 chip',
          price: 1999.99,
          category: 'Electronics',
          attributes: { brand: 'Apple', processor: 'M3' }
        })
      },
      {
        id: 2,
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Premium noise-canceling wireless headphones',
        price: 399.99,
        category: 'Electronics',
        attributes: { brand: 'Sony', type: 'Over-ear' },
        toJSON: () => ({
          id: 2,
          name: 'Sony WH-1000XM5 Headphones',
          description: 'Premium noise-canceling wireless headphones',
          price: 399.99,
          category: 'Electronics',
          attributes: { brand: 'Sony', type: 'Over-ear' }
        })
      }
    ];

    const mockRecommendations = [
      {
        id: 1,
        explanation: 'Perfect match for your college laptop needs',
        relevance_score: 9
      }
    ];

    beforeEach(() => {
      productService.getAllProducts.mockResolvedValue(mockProducts);
      productService.getProductById.mockImplementation((id) => {
        const product = mockProducts.find(p => p.id === id);
        return Promise.resolve(product);
      });
      llmService.getProductRecommendations.mockResolvedValue(mockRecommendations);
      searchHistoryService.recordSearch.mockResolvedValue({ id: 1 });
    });

    it('should perform successful search with default parameters', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({ query: 'laptop for college' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.query).toBe('laptop for college');
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0]).toMatchObject({
        id: 1,
        name: 'MacBook Pro 14-inch',
        ai_explanation: 'Perfect match for your college laptop needs',
        ai_relevance_score: 9
      });
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      });

      // Verify search history was recorded
      expect(searchHistoryService.recordSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'laptop for college',
          resultsCount: 1,
          success: true
        })
      );
    });

    it('should handle search with filters', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({
          query: 'laptop',
          filters: {
            category: 'Electronics',
            brand: 'Apple',
            minPrice: 1000,
            maxPrice: 2500
          },
          sortBy: 'price_desc',
          page: 1,
          limit: 5
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filters).toMatchObject({
        category: 'Electronics',
        brand: 'Apple',
        minPrice: 1000,
        maxPrice: 2500
      });
      expect(response.body.sortBy).toBe('price_desc');

      // Verify filtered products were passed to LLM
      expect(llmService.getProductRecommendations).toHaveBeenCalledWith(
        'laptop',
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Electronics',
            attributes: expect.objectContaining({ brand: 'Apple' })
          })
        ])
      );
    });

    it('should handle pagination correctly', async () => {
      const multipleRecommendations = [
        { id: 1, explanation: 'Great laptop', relevance_score: 9 },
        { id: 2, explanation: 'Good headphones', relevance_score: 8 }
      ];

      llmService.getProductRecommendations.mockResolvedValue(multipleRecommendations);

      const response = await request(app)
        .post('/api/search')
        .send({
          query: 'electronics',
          page: 1,
          limit: 1
        })
        .expect(200);

      expect(response.body.results).toHaveLength(1);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false
      });
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('MISSING_QUERY');
      expect(response.body.message).toBe('Search query is required');

      // Verify error was recorded in history
      expect(searchHistoryService.recordSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'MISSING_QUERY',
          success: false,
          errorType: 'MISSING_QUERY'
        })
      );
    });

    it('should return 400 for empty query', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({ query: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('EMPTY_QUERY');
      expect(response.body.message).toBe('Query cannot be empty');
    });

    it('should return 400 for query too long', async () => {
      const longQuery = 'a'.repeat(501);

      const response = await request(app)
        .post('/api/search')
        .send({ query: longQuery })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('QUERY_TOO_LONG');
      expect(response.body.message).toBe('Query must be less than 500 characters');
    });

    it('should handle no products available', async () => {
      productService.getAllProducts.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/search')
        .send({ query: 'laptop' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NO_PRODUCTS');
      expect(response.body.message).toBe('No products available in the database');
    });

    it('should handle no recommendations found', async () => {
      llmService.getProductRecommendations.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/search')
        .send({ query: 'nonexistent product' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(0);
      expect(response.body.message).toBe('No products match your search criteria. Try different keywords or broaden your search.');
    });

    it('should handle LLM service errors', async () => {
      const llmError = new Error('LLM Service Error');
      llmError.name = 'LLMServiceError';
      llmError.type = 'RATE_LIMIT_ERROR';

      llmService.getProductRecommendations.mockRejectedValue(llmError);

      const response = await request(app)
        .post('/api/search')
        .send({ query: 'laptop' })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.body.message).toBe('Too many requests. Please try again in a moment.');
      expect(response.body.retry_after).toBe(60);
    });
  });

  describe('GET /api/search/health', () => {
    it('should return healthy status when LLM service is working', async () => {
      llmService.testConnection.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/search/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body.message).toBe('LLM service is working correctly');
    });

    it('should return unhealthy status when LLM service is not working', async () => {
      llmService.testConnection.mockResolvedValue(false);

      const response = await request(app)
        .get('/api/search/health')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.message).toBe('LLM service is not responding correctly');
    });

    it('should handle health check errors', async () => {
      llmService.testConnection.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/search/health')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Health check failed');
    });
  });

  describe('GET /api/search/history', () => {
    it('should return search history with pagination', async () => {
      const mockHistory = {
        data: [
          { id: 1, query: 'laptop', success: true, resultsCount: 3 },
          { id: 2, query: 'headphones', success: true, resultsCount: 2 }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      searchHistoryService.getSearchHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/search/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2
      });
    });

    it('should handle search history with query parameters', async () => {
      const mockHistory = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };

      searchHistoryService.getSearchHistory.mockResolvedValue(mockHistory);

      await request(app)
        .get('/api/search/history')
        .query({
          page: 2,
          limit: 10,
          successOnly: 'true',
          query: 'laptop',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect(200);

      expect(searchHistoryService.getSearchHistory).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        successOnly: true,
        query: 'laptop',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      });
    });

    it('should handle search history errors', async () => {
      searchHistoryService.getSearchHistory.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/search/history')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('HISTORY_FETCH_ERROR');
      expect(response.body.message).toBe('Failed to fetch search history');
    });
  });

  describe('GET /api/search/popular', () => {
    it('should return popular search terms', async () => {
      const mockPopularSearches = [
        { query: 'laptop', searchCount: 15 },
        { query: 'headphones', searchCount: 10 },
        { query: 'smartphone', searchCount: 8 }
      ];

      searchHistoryService.getPopularSearches.mockResolvedValue(mockPopularSearches);

      const response = await request(app)
        .get('/api/search/popular')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toMatchObject({
        query: 'laptop',
        searchCount: 15
      });
      expect(response.body.period).toBe('30 days');
      expect(response.body.limit).toBe(10);
    });

    it('should handle custom limit and days parameters', async () => {
      searchHistoryService.getPopularSearches.mockResolvedValue([]);

      await request(app)
        .get('/api/search/popular')
        .query({ limit: 5, days: 7 })
        .expect(200);

      expect(searchHistoryService.getPopularSearches).toHaveBeenCalledWith(5, 7);
    });

    it('should handle popular searches errors', async () => {
      searchHistoryService.getPopularSearches.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/search/popular')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('POPULAR_SEARCHES_ERROR');
      expect(response.body.message).toBe('Failed to fetch popular searches');
    });
  });
}); 