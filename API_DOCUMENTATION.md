# Smart Product Assistant Backend API Documentation

## Overview

The Smart Product Assistant is an AI-powered product search and recommendation system built with Node.js, Express, Sequelize, and OpenAI's LLM services.

## Features

- 🤖 **AI-Powered Search**: Intelligent product recommendations using LLM
- 📈 **Search History**: Track and analyze search patterns  
- 🔍 **Advanced Filtering**: Filter by category, brand, price range, and attributes
- 📊 **Sorting Options**: Sort by price, name, date, and AI relevance score
- 📄 **Pagination**: Handle large result sets efficiently
- ⚡ **Error Handling**: Robust error handling with retry logic
- 🩺 **Health Monitoring**: Service health checks and monitoring
- 🧪 **Comprehensive Testing**: Unit and integration tests

## Endpoints

### Product Endpoints

#### GET /api/products
Get all products with optional filtering and pagination.

```bash
GET /api/products?page=1&limit=10
```

#### GET /api/products/:id
Get a specific product by ID.

```bash
GET /api/products/1
```

### Search Endpoints

#### POST /api/search
AI-powered product search with filtering, sorting, and pagination.

**Request Body:**
```json
{
  "query": "laptop for college",
  "filters": {
    "category": "Electronics",
    "brand": "Apple",
    "minPrice": 500,
    "maxPrice": 2000,
    "attributes": {
      "storage": "512GB"
    }
  },
  "sortBy": "price_desc",
  "page": 1,
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "query": "laptop for college",
  "results": [
    {
      "id": 1,
      "name": "MacBook Pro 14-inch",
      "description": "Professional laptop with M3 chip",
      "price": 1999.99,
      "category": "Electronics",
      "attributes": {
        "brand": "Apple",
        "processor": "M3",
        "storage": "512GB"
      },
      "ai_explanation": "Perfect match for your college laptop needs - lightweight, excellent battery life, and powerful enough for demanding coursework",
      "ai_relevance_score": 9
    }
  ],
  "filters": {
    "category": "Electronics",
    "brand": "Apple",
    "minPrice": 500,
    "maxPrice": 2000
  },
  "sortBy": "price_desc",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "total_results": 1,
  "execution_time_ms": 2340
}
```

**Supported Filters:**
- `category`: Filter by product category
- `brand`: Filter by brand name
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `attributes`: Filter by specific product attributes

**Supported Sort Options:**
- `relevance`: Sort by AI relevance score (default)
- `price_asc`: Price low to high
- `price_desc`: Price high to low
- `name_asc`: Name A to Z
- `name_desc`: Name Z to A
- `newest`: Newest products first
- `oldest`: Oldest products first

#### GET /api/search/health
Check the health status of the LLM service.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "message": "LLM service is working correctly",
  "execution_time_ms": 156,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /api/search/history
Get search history with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `successOnly`: Only successful searches (default: false)
- `query`: Filter by search query text
- `startDate`: Filter from date (ISO string)
- `endDate`: Filter to date (ISO string)

```bash
GET /api/search/history?page=1&limit=20&successOnly=true&query=laptop
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "query": "laptop for college",
      "resultsCount": 3,
      "executionTimeMs": 1250,
      "success": true,
      "errorType": null,
      "filters": {"category": "Electronics"},
      "sortBy": "relevance",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### GET /api/search/popular
Get popular search terms with analytics.

**Query Parameters:**
- `limit`: Number of popular terms (default: 10)
- `days`: Days to look back (default: 30)

```bash
GET /api/search/popular?limit=5&days=7
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "query": "laptop",
      "searchCount": "15"
    },
    {
      "query": "headphones", 
      "searchCount": "10"
    }
  ],
  "period": "7 days",
  "limit": 5
}
```

## Error Handling

The API uses structured error responses with appropriate HTTP status codes:

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error
- `502`: Bad Gateway (LLM service errors)
- `503`: Service Unavailable
- `504`: Gateway Timeout

### Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "execution_time_ms": 1250
}
```

### Common Error Codes

- `MISSING_QUERY`: Search query is required
- `EMPTY_QUERY`: Query cannot be empty
- `QUERY_TOO_LONG`: Query exceeds 500 characters
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable
- `AI_SERVICE_ERROR`: LLM service error

## Rate Limiting & Retry Logic

The system implements intelligent retry logic for transient failures:

- **Maximum 3 retries** with exponential backoff
- **Base delay**: 1 second
- **Max delay**: 10 seconds
- **Backoff multiplier**: 2x

Certain errors (quota exceeded, invalid API key) are not retried.

## Search History Tracking

All search requests are automatically tracked with the following data:

- Search query
- Success/failure status
- Number of results
- Execution time
- Applied filters and sorting
- User agent and IP address
- Error type (if failed)

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Types

- **Unit Tests**: Service methods and controller helpers
- **Integration Tests**: Full API endpoint testing
- **Mocking**: Database and external service mocking

### Test Coverage

- Controllers: Search functionality and error handling
- Services: Product service, LLM service, search history service  
- Models: Database models and relationships

## Environment Variables

Required environment variables:

```bash
NODE_ENV=development
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

## Database Schema

### Products Table
- `id`: Primary key
- `name`: Product name
- `description`: Product description  
- `price`: Product price
- `category`: Product category
- `imageUrl`: Product image URL
- `attributes`: JSON attributes (brand, specs, etc.)
- `createdAt`, `updatedAt`: Timestamps

### Search History Table
- `id`: Primary key
- `query`: Search query text
- `results_count`: Number of results returned
- `execution_time_ms`: Time taken to execute
- `success`: Whether search was successful
- `error_type`: Error type if failed
- `user_agent`: User agent string
- `ip_address`: IP address
- `filters`: Applied filters (JSON)
- `sort_by`: Sort criteria used
- `createdAt`, `updatedAt`: Timestamps

## Performance Considerations

- **Pagination**: All list endpoints support pagination
- **Indexing**: Database indexes on frequently queried fields
- **Caching**: Search history for analytics and popular terms
- **Timeouts**: 30-second timeout for LLM requests
- **Error Handling**: Graceful degradation on service failures

## Example Usage

### Basic Search
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "wireless headphones"}'
```

### Advanced Search with Filters
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "laptop",
    "filters": {
      "category": "Electronics",
      "minPrice": 1000,
      "maxPrice": 2500,
      "brand": "Apple"
    },
    "sortBy": "price_desc",
    "page": 1,
    "limit": 5
  }'
```

### Check Service Health
```bash
curl http://localhost:3000/api/search/health
```

### Get Search History
```bash
curl "http://localhost:3000/api/search/history?page=1&limit=10&successOnly=true"
```

### Get Popular Searches
```bash
curl "http://localhost:3000/api/search/popular?limit=5&days=7"
``` 