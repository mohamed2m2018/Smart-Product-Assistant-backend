# Smart Product Assistant Backend

## 🚀 Project Overview

The Smart Product Assistant is an intelligent, AI-powered product search and recommendation system designed to help users find the most relevant products based on natural language queries. The system combines traditional product filtering with advanced Large Language Model (LLM) capabilities to provide contextually aware, personalized product recommendations.

### Key Features

- **🤖 AI-Powered Search**: Uses OpenAI's GPT models to understand user intent and match products contextually
- **📊 Advanced Filtering**: Multi-dimensional filtering by category, brand, price range, and custom attributes
- **🔄 Smart Sorting**: Multiple sorting options including AI relevance scoring, price, name, and date
- **📈 Search Analytics**: Comprehensive search history tracking and popular search analytics
- **⚡ Performance Optimized**: Pagination, database indexing, and efficient query handling
- **🛡️ Robust Error Handling**: Exponential backoff retry logic and comprehensive error management
- **🩺 Health Monitoring**: Service health checks and performance monitoring
- **🧪 Test Coverage**: Comprehensive unit and integration testing (52 tests)

### Use Cases

- **E-commerce Platforms**: Enhanced product discovery and search experience
- **Product Catalogs**: Intelligent product recommendation systems
- **Inventory Management**: Smart product matching and categorization
- **Customer Support**: Automated product assistance and recommendations

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **OpenAI API Key**: Required for LLM functionality

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Smart-Product-Assistant-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```bash
   NODE_ENV=development
   PORT=3000
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-3.5-turbo
   ```

   **Getting an OpenAI API Key:**
   - Visit [OpenAI Platform](https://platform.openai.com/account/api-keys)
   - Create an account or sign in
   - Generate a new API key
   - Add billing information (required for API usage)

4. **Database Setup**
   
   The application uses SQLite for simplicity. The database will be automatically created on first run:
   ```bash
   npm start
   ```

5. **Development Mode**
   ```bash
   npm run dev
   ```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Production Deployment

```bash
# Set production environment
NODE_ENV=production

# Start the server
npm start
```

## 🏗️ Technology Stack

### Backend Framework
- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Minimal and flexible web application framework
- **Morgan**: HTTP request logger middleware for debugging and monitoring

### Database & ORM
- **SQLite**: Lightweight, file-based SQL database for development and testing
- **Sequelize**: Promise-based Node.js ORM with robust features
  - Model definitions with validation
  - Automatic table creation and migrations
  - Database indexing for performance optimization
  - JSON field support for flexible attribute storage

### AI & LLM Integration
- **LangChain**: Framework for developing applications with language models
  - `@langchain/openai`: OpenAI integration for chat completions
  - `@langchain/core`: Core LangChain functionality for prompts and parsers
- **OpenAI GPT**: Large Language Model for intelligent product matching
  - Structured output parsing with JSON responses
  - Advanced prompt engineering for consistent results
  - Error handling and retry mechanisms

### Testing Framework
- **Jest**: JavaScript testing framework with mocking capabilities
- **Supertest**: HTTP testing library for API endpoint testing
- **Test Coverage**: Unit tests, integration tests, and mocking strategies

### Development Tools
- **Nodemon**: Development tool for automatic server restart
- **dotenv**: Environment variable management
- **ESLint** (optional): Code linting and formatting

### Architecture Patterns
- **MVC Pattern**: Separation of concerns with Models, Views (API responses), and Controllers
- **Service Layer**: Business logic abstraction in dedicated service modules
- **Repository Pattern**: Data access abstraction through Sequelize models
- **Error-First Callbacks**: Consistent error handling throughout the application

## 📚 API Documentation

For comprehensive API documentation with request/response examples, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Quick Reference

#### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products with pagination |
| `GET` | `/api/products/:id` | Get specific product by ID |
| `POST` | `/api/search` | AI-powered product search |
| `GET` | `/api/search/health` | LLM service health check |
| `GET` | `/api/search/history` | Search history with analytics |
| `GET` | `/api/search/popular` | Popular search terms |

#### Search Example

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "lightweight laptop for college under $1500",
    "filters": {
      "category": "Electronics",
      "maxPrice": 1500
    },
    "sortBy": "price_asc",
    "page": 1,
    "limit": 5
  }'
```

#### Response Format

```json
{
  "success": true,
  "query": "lightweight laptop for college under $1500",
  "results": [
    {
      "id": 3,
      "name": "MacBook Pro 14-inch",
      "price": 1999.99,
      "ai_explanation": "Perfect match for college needs - lightweight design, excellent battery life, and powerful M3 chip",
      "ai_relevance_score": 9
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 3,
    "totalPages": 1
  },
  "execution_time_ms": 1250
}
```

## 🧠 LLM Integration Approach

### Architecture Overview

The LLM integration is designed as a modular, robust system that enhances traditional product search with AI-powered understanding:

```
User Query → Product Filtering → LLM Analysis → Relevance Scoring → Final Results
```

### Implementation Strategy

#### 1. **Prompt Engineering**
- **Expert Persona**: AI acts as a knowledgeable product assistant
- **Structured Analysis Framework**: 3-step process (Understanding → Evaluation → Ranking)
- **Contextual Instructions**: Specific guidance for different query types (budget, brand, features)
- **Quality Examples**: Show/tell approach for explanation quality

#### 2. **Data Flow**
```javascript
// Simplified flow
const recommendations = await llmService.getProductRecommendations(
  userQuery,           // "laptop for college under $1500"
  filteredProducts     // Pre-filtered by traditional filters
);
```

#### 3. **Structured Output**
- **JSON Schema Enforcement**: Consistent response format with validation
- **Relevance Scoring**: 1-10 scale with clear criteria
- **Explanations**: Contextual reasoning for each recommendation
- **Error Handling**: Graceful degradation when LLM fails

#### 4. **Performance Optimization**
- **Pre-filtering**: Reduce LLM payload by applying basic filters first
- **Timeout Management**: 30-second timeout with retry logic
- **Caching Strategy**: Search history for popular query optimization
- **Batch Processing**: Efficient product data formatting

### Prompt Engineering Details

#### Core Prompt Structure
```
You are an expert Smart Product Assistant AI with deep knowledge of consumer products.

ANALYSIS FRAMEWORK:
1. Query Understanding: Identify primary need, budget hints, requirements
2. Product Evaluation: Match based on relevance, value, features
3. Ranking Logic: Prioritize exact matches > alternatives > related

SCORING CRITERIA (1-10):
- 9-10: Perfect match (exactly what user asked for)
- 7-8: Excellent match (meets primary needs)
- 5-6: Good match (related category)
- 3-4: Fair match (missing key requirements)
- 1-2: Poor match (minimal relevance)
```

#### Context-Aware Matching
- **Budget Queries**: Focus on price ranges and value propositions
- **Brand Queries**: Prioritize specific brand mentions
- **Feature Queries**: Match technical specifications
- **Use Case Queries**: Consider practical applications

#### Quality Control
- **Response Validation**: Ensure all required fields are present
- **Explanation Quality**: Minimum 10 characters, specific reasoning
- **Product ID Verification**: Only recommend existing products
- **Score Normalization**: Ensure scores are within 1-10 range

## 🔄 Trade-offs and Future Improvements

### Current Trade-offs

#### 1. **Database Choice**
- **Current**: SQLite for simplicity and development speed
- **Trade-off**: Limited concurrent connections and scalability
- **Future**: PostgreSQL or MongoDB for production scalability

#### 2. **LLM Costs**
- **Current**: Direct OpenAI API calls for every search
- **Trade-off**: Higher costs and latency per request
- **Mitigation**: Implemented retry logic and error handling
- **Future**: Caching, embeddings-based similarity search

#### 3. **Search History Storage**
- **Current**: All search data stored indefinitely
- **Trade-off**: Database growth and potential privacy concerns
- **Future**: Data retention policies and GDPR compliance

#### 4. **Real-time Features**
- **Current**: Synchronous processing for all requests
- **Trade-off**: Slower response times for complex queries
- **Future**: Async processing and real-time updates

### Future Improvements

#### 🚀 **Phase 1: Performance & Scalability**

1. **Caching Layer**
   - Redis for frequent queries
   - Embeddings cache for similar searches
   - Popular product recommendations

2. **Database Optimization**
   - PostgreSQL migration
   - Read replicas for scaling
   - Database connection pooling

3. **Async Processing**
   - Queue system for heavy operations
   - Background analytics processing
   - Real-time search suggestions

#### 🤖 **Phase 2: AI Enhancement**

1. **Vector Search Integration**
   - Product embeddings for semantic similarity
   - Hybrid search (keyword + semantic)
   - Reduced LLM API costs

2. **Personalization**
   - User preference learning
   - Search history-based recommendations
   - Collaborative filtering

3. **Advanced Analytics**
   - Search intent classification
   - Product trend analysis
   - A/B testing framework

#### 🔧 **Phase 3: Enterprise Features**

1. **Multi-tenancy**
   - Multiple product catalogs
   - Organization-level configurations
   - Role-based access control

2. **API Rate Limiting**
   - User-based rate limits
   - Premium tier support
   - API key management

3. **Monitoring & Observability**
   - Application performance monitoring
   - LLM usage analytics
   - Cost optimization insights

#### 🌐 **Phase 4: Integration & Ecosystem**

1. **External Integrations**
   - E-commerce platform plugins
   - Webhook support for real-time updates
   - Third-party analytics integration

2. **Mobile Support**
   - React Native mobile app
   - Progressive Web App (PWA)
   - Voice search capabilities

3. **Advanced Search Features**
   - Image-based search
   - Barcode scanning
   - Augmented reality product visualization

### Technical Debt Considerations

1. **Testing Coverage**: Expand to include edge cases and performance testing
2. **Documentation**: API versioning and more detailed integration guides  
3. **Security**: Add authentication, authorization, and input sanitization
4. **Monitoring**: Implement comprehensive logging and alerting systems
5. **Configuration**: Environment-specific configurations and feature flags

### Performance Benchmarks

| Metric | Current | Target |
|--------|---------|--------|
| Search Response Time | 1-3 seconds | <500ms |
| LLM API Calls | 1 per search | Cached/Reduced |
| Database Queries | 2-4 per search | <2 per search |
| Concurrent Users | 10-50 | 1000+ |
| Test Coverage | 95% | 98% |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Support

For questions, issues, or feature requests, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ using Node.js, Express, Sequelize, and OpenAI**