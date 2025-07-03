const searchHistoryService = require('../../services/searchHistoryService');
const { models } = require('../../models');

// Mock the models
jest.mock('../../models', () => ({
  models: {
    SearchHistory: {
      create: jest.fn(),
      findAndCountAll: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      destroy: jest.fn(),
      sequelize: {
        fn: jest.fn(),
        col: jest.fn()
      }
    }
  }
}));

describe('SearchHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordSearch', () => {
    it('should record a successful search', async () => {
      const mockSearchHistory = {
        id: 1,
        query: 'test query',
        resultsCount: 5,
        success: true
      };

      models.SearchHistory.create.mockResolvedValue(mockSearchHistory);

      const searchData = {
        query: 'test query',
        resultsCount: 5,
        executionTimeMs: 1000,
        success: true,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1'
      };

      const result = await searchHistoryService.recordSearch(searchData);

      expect(models.SearchHistory.create).toHaveBeenCalledWith({
        query: 'test query',
        resultsCount: 5,
        executionTimeMs: 1000,
        success: true,
        errorType: null,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        filters: {},
        sortBy: null
      });

      expect(result).toEqual(mockSearchHistory);
    });

    it('should record a failed search with error type', async () => {
      const mockSearchHistory = {
        id: 2,
        query: 'failed query',
        resultsCount: 0,
        success: false,
        errorType: 'VALIDATION_ERROR'
      };

      models.SearchHistory.create.mockResolvedValue(mockSearchHistory);

      const searchData = {
        query: 'failed query',
        resultsCount: 0,
        success: false,
        errorType: 'VALIDATION_ERROR',
        executionTimeMs: 500
      };

      const result = await searchHistoryService.recordSearch(searchData);

      expect(models.SearchHistory.create).toHaveBeenCalledWith({
        query: 'failed query',
        resultsCount: 0,
        executionTimeMs: 500,
        success: false,
        errorType: 'VALIDATION_ERROR',
        userAgent: null,
        ipAddress: null,
        filters: {},
        sortBy: null
      });

      expect(result).toEqual(mockSearchHistory);
    });

    it('should handle database errors', async () => {
      models.SearchHistory.create.mockRejectedValue(new Error('Database error'));

      const searchData = {
        query: 'test query',
        success: true
      };

      await expect(searchHistoryService.recordSearch(searchData))
        .rejects.toThrow('Database error');
    });
  });

  describe('getSearchHistory', () => {
    it('should return paginated search history', async () => {
      const mockRows = [
        { id: 1, query: 'query 1', success: true },
        { id: 2, query: 'query 2', success: true }
      ];

      models.SearchHistory.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: mockRows
      });

      const options = {
        page: 1,
        limit: 2,
        successOnly: true
      };

      const result = await searchHistoryService.getSearchHistory(options);

      expect(result).toEqual({
        data: mockRows,
        pagination: {
          page: 1,
          limit: 2,
          total: 10,
          totalPages: 5,
          hasNextPage: true,
          hasPrevPage: false
        }
      });

      expect(models.SearchHistory.findAndCountAll).toHaveBeenCalledWith({
        where: { success: true },
        order: [['createdAt', 'DESC']],
        limit: 2,
        offset: 0
      });
    });

    it('should apply query filter', async () => {
      const mockRows = [
        { id: 1, query: 'laptop query', success: true }
      ];

      models.SearchHistory.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockRows
      });

      const options = {
        page: 1,
        limit: 20,
        query: 'laptop'
      };

      await searchHistoryService.getSearchHistory(options);

      expect(models.SearchHistory.findAndCountAll).toHaveBeenCalledWith({
        where: {
          query: {
            [require('sequelize').Op.iLike]: '%laptop%'
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 20,
        offset: 0
      });
    });

    it('should handle database errors', async () => {
      models.SearchHistory.findAndCountAll.mockRejectedValue(new Error('Database error'));

      await expect(searchHistoryService.getSearchHistory())
        .rejects.toThrow('Database error');
    });
  });

  describe('getPopularSearches', () => {
    it('should return popular search terms', async () => {
      const mockPopularSearches = [
        { query: 'laptop', searchCount: '10' },
        { query: 'headphones', searchCount: '5' }
      ];

      models.SearchHistory.findAll.mockResolvedValue(mockPopularSearches);

      const result = await searchHistoryService.getPopularSearches(10, 30);

      expect(result).toEqual([
        { query: 'laptop', searchCount: '10' },
        { query: 'headphones', searchCount: '5' }
      ]);

      expect(models.SearchHistory.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          success: true,
          createdAt: expect.any(Object)
        }),
        attributes: [
          'query',
          expect.any(Array) // [sequelize.fn('COUNT', '*'), 'searchCount']
        ],
        group: ['query'],
        order: expect.any(Array),
        limit: 10,
        raw: true
      });
    });

    it('should handle database errors', async () => {
      models.SearchHistory.findAll.mockRejectedValue(new Error('Database error'));

      await expect(searchHistoryService.getPopularSearches())
        .rejects.toThrow('Database error');
    });
  });
}); 