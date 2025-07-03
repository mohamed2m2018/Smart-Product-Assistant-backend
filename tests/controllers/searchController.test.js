const searchController = require('../../controllers/searchController');

describe('SearchController Helper Methods', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'MacBook Pro 14-inch',
      price: 1999.99,
      category: 'Electronics',
      attributes: { brand: 'Apple', processor: 'M3', storage: '512GB' },
      createdAt: '2024-01-01T00:00:00Z',
      ai_relevance_score: 9
    },
    {
      id: 2,
      name: 'Sony WH-1000XM5 Headphones',
      price: 399.99,
      category: 'Electronics',
      attributes: { brand: 'Sony', type: 'Over-ear' },
      createdAt: '2024-01-02T00:00:00Z',
      ai_relevance_score: 8
    },
    {
      id: 3,
      name: 'Nike Air Jordan 1 High',
      price: 170.00,
      category: 'Footwear',
      attributes: { brand: 'Nike', color: 'Black/Red/White', material: 'Leather' },
      createdAt: '2024-01-03T00:00:00Z',
      ai_relevance_score: 7
    },
    {
      id: 4,
      name: 'Apple iPhone 15 Pro',
      price: 999.99,
      category: 'Electronics',
      attributes: { brand: 'Apple', storage: '128GB', color: 'Natural Titanium' },
      createdAt: '2024-01-04T00:00:00Z',
      ai_relevance_score: 6
    }
  ];

  describe('_applyFilters', () => {
    it('should filter by category', () => {
      const filters = { category: 'Electronics' };
      const result = searchController._applyFilters(mockProducts, filters);
      
      expect(result).toHaveLength(3);
      expect(result.every(p => p.category === 'Electronics')).toBe(true);
    });

    it('should filter by category case-insensitive', () => {
      const filters = { category: 'electronics' };
      const result = searchController._applyFilters(mockProducts, filters);
      
      expect(result).toHaveLength(3);
      expect(result.every(p => p.category === 'Electronics')).toBe(true);
    });

    it('should filter by brand', () => {
      const filters = { brand: 'Apple' };
      const result = searchController._applyFilters(mockProducts, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(p => p.attributes.brand === 'Apple')).toBe(true);
    });

    it('should filter by brand case-insensitive', () => {
      const filters = { brand: 'apple' };
      const result = searchController._applyFilters(mockProducts, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(p => p.attributes.brand === 'Apple')).toBe(true);
    });

    it('should filter by minimum price', () => {
      const filters = { minPrice: 500 };
      const result = searchController._applyFilters(mockProducts, filters);
      
      expect(result).toHaveLength(2); // MacBook and iPhone
      expect(result.every(p => p.price >= 500)).toBe(true);
    });

    it('should filter by maximum price', () => {
      const filters = { maxPrice: 500 };
      const result = searchController._applyFilters(mockProducts, filters);
      
      expect(result).toHaveLength(2); // Sony headphones and Nike shoes
      expect(result.every(p => p.price <= 500)).toBe(true);
    });

    it('should filter by price range', () => {
      const filters = { minPrice: 300, maxPrice: 1000 };
      const result = searchController._applyFilters(mockProducts, filters);
      
      expect(result).toHaveLength(2); // Sony headphones and iPhone
      expect(result.every(p => p.price >= 300 && p.price <= 1000)).toBe(true);
    });

         it('should filter by custom attributes', () => {
       const filters = { 
         attributes: { 
           storage: '512GB'
         }
       };
       const result = searchController._applyFilters(mockProducts, filters);
       
       expect(result).toHaveLength(1); // Only MacBook has 512GB storage
       expect(result[0].name).toBe('MacBook Pro 14-inch');
     });

    it('should combine multiple filters', () => {
      const filters = {
        category: 'Electronics',
        brand: 'Apple',
        minPrice: 1500
      };
      const result = searchController._applyFilters(mockProducts, filters);
      
      expect(result).toHaveLength(1); // Only MacBook Pro
      expect(result[0].name).toBe('MacBook Pro 14-inch');
    });

    it('should return empty array when no products match filters', () => {
      const filters = { category: 'NonExistent' };
      const result = searchController._applyFilters(mockProducts, filters);
      
      expect(result).toHaveLength(0);
    });

    it('should return all products when no filters applied', () => {
      const filters = {};
      const result = searchController._applyFilters(mockProducts, filters);
      
      expect(result).toHaveLength(4);
      expect(result).toEqual(mockProducts);
    });
  });

  describe('_applySorting', () => {
    it('should sort by price ascending', () => {
      const result = searchController._applySorting([...mockProducts], 'price_asc');
      
      expect(result[0].price).toBe(170.00);   // Nike shoes
      expect(result[1].price).toBe(399.99);   // Sony headphones
      expect(result[2].price).toBe(999.99);   // iPhone
      expect(result[3].price).toBe(1999.99);  // MacBook
    });

    it('should sort by price descending', () => {
      const result = searchController._applySorting([...mockProducts], 'price_desc');
      
      expect(result[0].price).toBe(1999.99);  // MacBook
      expect(result[1].price).toBe(999.99);   // iPhone
      expect(result[2].price).toBe(399.99);   // Sony headphones
      expect(result[3].price).toBe(170.00);   // Nike shoes
    });

    it('should sort by name ascending', () => {
      const result = searchController._applySorting([...mockProducts], 'name_asc');
      
      expect(result[0].name).toBe('Apple iPhone 15 Pro');
      expect(result[1].name).toBe('MacBook Pro 14-inch');
      expect(result[2].name).toBe('Nike Air Jordan 1 High');
      expect(result[3].name).toBe('Sony WH-1000XM5 Headphones');
    });

    it('should sort by name descending', () => {
      const result = searchController._applySorting([...mockProducts], 'name_desc');
      
      expect(result[0].name).toBe('Sony WH-1000XM5 Headphones');
      expect(result[1].name).toBe('Nike Air Jordan 1 High');
      expect(result[2].name).toBe('MacBook Pro 14-inch');
      expect(result[3].name).toBe('Apple iPhone 15 Pro');
    });

    it('should sort by newest first', () => {
      const result = searchController._applySorting([...mockProducts], 'newest');
      
      expect(result[0].createdAt).toBe('2024-01-04T00:00:00Z'); // iPhone (latest)
      expect(result[1].createdAt).toBe('2024-01-03T00:00:00Z'); // Nike
      expect(result[2].createdAt).toBe('2024-01-02T00:00:00Z'); // Sony
      expect(result[3].createdAt).toBe('2024-01-01T00:00:00Z'); // MacBook (oldest)
    });

    it('should sort by oldest first', () => {
      const result = searchController._applySorting([...mockProducts], 'oldest');
      
      expect(result[0].createdAt).toBe('2024-01-01T00:00:00Z'); // MacBook (oldest)
      expect(result[1].createdAt).toBe('2024-01-02T00:00:00Z'); // Sony
      expect(result[2].createdAt).toBe('2024-01-03T00:00:00Z'); // Nike
      expect(result[3].createdAt).toBe('2024-01-04T00:00:00Z'); // iPhone (latest)
    });

    it('should sort by relevance (default)', () => {
      const result = searchController._applySorting([...mockProducts], 'relevance');
      
      expect(result[0].ai_relevance_score).toBe(9); // MacBook
      expect(result[1].ai_relevance_score).toBe(8); // Sony
      expect(result[2].ai_relevance_score).toBe(7); // Nike
      expect(result[3].ai_relevance_score).toBe(6); // iPhone
    });

    it('should default to relevance for unknown sort type', () => {
      const result = searchController._applySorting([...mockProducts], 'unknown_sort');
      
      expect(result[0].ai_relevance_score).toBe(9); // MacBook (highest relevance)
    });

    it('should handle products without relevance score', () => {
      const productsWithoutScore = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2', ai_relevance_score: 8 }
      ];
      
      const result = searchController._applySorting(productsWithoutScore, 'relevance');
      
      expect(result[0].ai_relevance_score).toBe(8); // Product with score first
      expect(result[1].ai_relevance_score).toBeUndefined(); // Product without score last
    });
  });

  describe('_applyPagination', () => {
    it('should paginate results correctly - first page', () => {
      const result = searchController._applyPagination(mockProducts, 1, 2);
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 4,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false
      });
    });

    it('should paginate results correctly - second page', () => {
      const result = searchController._applyPagination(mockProducts, 2, 2);
      
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(3);
      expect(result.data[1].id).toBe(4);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 2,
        total: 4,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true
      });
    });

    it('should handle partial last page', () => {
      const result = searchController._applyPagination(mockProducts, 2, 3);
      
      expect(result.data).toHaveLength(1); // Only 1 item on last page
      expect(result.data[0].id).toBe(4);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 3,
        total: 4,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true
      });
    });

    it('should handle empty results', () => {
      const result = searchController._applyPagination([], 1, 10);
      
      expect(result.data).toHaveLength(0);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    });

    it('should handle page beyond available data', () => {
      const result = searchController._applyPagination(mockProducts, 10, 2);
      
      expect(result.data).toHaveLength(0);
      expect(result.pagination).toEqual({
        page: 10,
        limit: 2,
        total: 4,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true
      });
    });

    it('should handle single page with all items', () => {
      const result = searchController._applyPagination(mockProducts, 1, 10);
      
      expect(result.data).toHaveLength(4);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 4,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    });
  });
}); 