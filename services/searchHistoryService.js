const { models } = require('../models');
const { Op } = require('sequelize');

const searchHistoryService = {
  /**
   * Record a search query in the history
   */
  recordSearch: async (searchData) => {
    try {
      const searchHistory = await models.SearchHistory.create({
        query: searchData.query,
        resultsCount: searchData.resultsCount || 0,
        executionTimeMs: searchData.executionTimeMs || 0,
        success: searchData.success !== false,
        errorType: searchData.errorType || null,
        userAgent: searchData.userAgent || null,
        ipAddress: searchData.ipAddress || null,
        filters: searchData.filters || {},
        sortBy: searchData.sortBy || null,
        userId: searchData.userId || null // Support both authenticated and anonymous users
      });

      return searchHistory;
    } catch (error) {
      console.error('Error recording search history:', error);
      throw error;
    }
  },

  /**
   * Get search history with pagination and filtering
   */
  getSearchHistory: async (options = {}) => {
    try {
      const {
        page = 1,
        limit = 20,
        successOnly = false,
        query = null,
        startDate = null,
        endDate = null,
        userId = null // Add userId filtering
      } = options;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filter by user (null for anonymous users)
      if (userId !== undefined) {
        whereClause.userId = userId;
      }

      if (successOnly) {
        whereClause.success = true;
      }

      if (query) {
        whereClause.query = {
          [Op.iLike]: `%${query}%`
        };
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt[Op.gte] = startDate;
        }
        if (endDate) {
          whereClause.createdAt[Op.lte] = endDate;
        }
      }

      const { count, rows } = await models.SearchHistory.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
          hasNextPage: page < Math.ceil(count / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching search history:', error);
      throw error;
    }
  },

  /**
   * Get popular search terms
   */
  getPopularSearches: async (limit = 10, days = 30, userId = null) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const whereClause = {
        success: true,
        createdAt: {
          [Op.gte]: startDate
        }
      };

      // If userId is provided, filter by user; otherwise show global popular searches
      if (userId !== null) {
        whereClause.userId = userId;
      }

      const popularSearches = await models.SearchHistory.findAll({
        where: whereClause,
        attributes: [
          'query',
          [models.SearchHistory.sequelize.fn('COUNT', '*'), 'searchCount']
        ],
        group: ['query'],
        order: [[models.SearchHistory.sequelize.fn('COUNT', '*'), 'DESC']],
        limit: parseInt(limit),
        raw: true
      });

      return popularSearches;
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      throw error;
    }
  }
};

module.exports = searchHistoryService; 