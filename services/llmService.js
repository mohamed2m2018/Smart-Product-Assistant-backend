const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { JsonOutputParser } = require('@langchain/core/output_parsers');

// Initialize OpenAI LLM with performance-optimized configuration
const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: 0.1,
  maxTokens: 800, // Reduced for faster responses
  timeout: 8000, // Reduced timeout for faster responses
});

// Define the output schema for structured parsing
const outputParser = new JsonOutputParser();

// Optimized prompt template - more concise for faster processing
const promptTemplate = PromptTemplate.fromTemplate(`
You are a shopping assistant. Recommend the best products for: "{userQuery}"

PRODUCTS:
{products}

IMPORTANT: You must return a valid JSON array only. No other text.

Return JSON array with recommended products (max 5):
[{{"id": number, "explanation": "brief reason why this fits", "relevance_score": number}}]

Example: [{{"id": 1, "explanation": "Perfect for your needs", "relevance_score": 8}}]

Focus on most relevant matches. Keep explanations under 40 words.
`);

// Retry configuration for rate limiting and transient errors
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

// Enhanced error types for better handling
class LLMServiceError extends Error {
  constructor(message, type, originalError = null) {
    super(message);
    this.name = 'LLMServiceError';
    this.type = type;
    this.originalError = originalError;
  }
}

// Sleep utility for retry delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Pre-filtering removed - was causing no results issue

// Smart Product Assistant service with enhanced error handling
const llmService = {
  /**
   * Analyze user query and recommend relevant products with enhanced performance
   * @param {string} userQuery - The user's search query or request
   * @param {Array} products - Array of product objects from the database
   * @returns {Promise<Array>} - Array of recommended products with explanations and scores
   */
  getProductRecommendations: async (userQuery, products) => {
    const startTime = Date.now();
    
    try {
      // Input validation
      if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length === 0) {
        throw new LLMServiceError('User query is required and must be a non-empty string', 'VALIDATION_ERROR');
      }

      if (!products || !Array.isArray(products) || products.length === 0) {
        throw new LLMServiceError('Products array is required and must not be empty', 'VALIDATION_ERROR');
      }

      // Configuration validation
      if (!process.env.OPENAI_API_KEY) {
        throw new LLMServiceError('OPENAI_API_KEY environment variable is not set', 'CONFIGURATION_ERROR');
      }

      // Use all products - pre-filtering removed for better results
      if (products.length === 0) {
        console.log('📭 No products available');
        return [];
      }

      // Streamlined product formatting - more concise for faster processing
      const formattedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        description: (product.description || '').substring(0, 100) + '...', // Truncate descriptions safely
        price: `$${product.price}`,
        category: product.category,
        brand: product.attributes?.brand || 'Unknown'
      }));

      console.log(`🤖 LLM Request - Query: "${userQuery.substring(0, 50)}${userQuery.length > 50 ? '...' : ''}", Products: ${products.length}`);

      // Execute with retry logic
      const result = await llmService._executeWithRetry(async () => {
        const chain = promptTemplate.pipe(llm).pipe(outputParser);
        
        return await chain.invoke({
          userQuery: userQuery.trim(),
          products: JSON.stringify(formattedProducts)
        });
      });

      // Enhanced response validation and processing
      const validatedResults = llmService._validateAndProcessResults(result, products);
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ LLM Response - Recommendations: ${validatedResults.length}, Time: ${executionTime}ms`);

      return validatedResults;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ LLM Error - Time: ${executionTime}ms, Error:`, error.message);
      
      // Re-throw with context if it's already our custom error
      if (error instanceof LLMServiceError) {
        throw error;
      }
      
      // Handle specific OpenAI API errors
      if (error.message?.includes('rate limit')) {
        throw new LLMServiceError('API rate limit exceeded. Please try again in a moment.', 'RATE_LIMIT_ERROR', error);
      }
      
      if (error.message?.includes('insufficient_quota')) {
        throw new LLMServiceError('API quota exceeded. Please check your OpenAI billing.', 'QUOTA_ERROR', error);
      }
      
      if (error.message?.includes('timeout')) {
        throw new LLMServiceError('Request timeout. The service is taking too long to respond.', 'TIMEOUT_ERROR', error);
      }
      
      // Generic API error
      throw new LLMServiceError(`Product recommendation failed: ${error.message}`, 'API_ERROR', error);
    }
  },

  /**
   * Execute LLM request with exponential backoff retry logic
   * @private
   */
  _executeWithRetry: async (operation) => {
    let lastError;
    
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (error.message?.includes('insufficient_quota') || 
            error.message?.includes('invalid_api_key')) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === RETRY_CONFIG.maxRetries) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelay
        );
        
        console.log(`🔄 LLM Retry ${attempt + 1}/${RETRY_CONFIG.maxRetries} in ${delay}ms - Error: ${error.message}`);
        await sleep(delay);
      }
    }
    
    throw lastError;
  },

  /**
   * Extract key features from product attributes for better LLM understanding
   * @private
   */
  _extractKeyFeatures: (attributes) => {
    if (!attributes || typeof attributes !== 'object') return [];
    
    const features = [];
    const importantKeys = ['brand', 'color', 'material', 'storage', 'processor', 'memory', 'type', 'style', 'capacity'];
    
    importantKeys.forEach(key => {
      if (attributes[key]) {
        features.push(`${key}: ${attributes[key]}`);
      }
    });
    
    return features;
  },

  /**
   * Validate and process LLM results with enhanced error checking
   * @private
   */
  _validateAndProcessResults: (result, originalProducts) => {
    if (!Array.isArray(result)) {
      throw new LLMServiceError('LLM returned invalid response format (not an array)', 'RESPONSE_ERROR');
    }

    if (result.length === 0) {
      console.log('📭 No product recommendations returned by LLM');
      return [];
    }

    const validatedResults = [];
    const productIds = new Set(originalProducts.map(p => p.id));

    for (const item of result) {
      try {
        // Validate required fields
        if (!item.id || !item.explanation || typeof item.relevance_score === 'undefined') {
          console.warn('⚠️ Skipping invalid recommendation object:', item);
          continue;
        }

        const productId = parseInt(item.id);
        
        // Check if product ID exists
        if (!productIds.has(productId)) {
          console.warn(`⚠️ Skipping recommendation for non-existent product ID: ${productId}`);
          continue;
        }

        // Validate and normalize fields
        const recommendation = {
          id: productId,
          explanation: String(item.explanation).trim(),
          relevance_score: Math.min(Math.max(parseInt(item.relevance_score) || 1, 1), 10)
        };

        // Validate explanation quality
        if (recommendation.explanation.length < 10) {
          console.warn(`⚠️ Skipping recommendation with insufficient explanation for product ${productId}`);
          continue;
        }

        validatedResults.push(recommendation);
        
      } catch (error) {
        console.warn('⚠️ Error processing recommendation:', error.message, item);
      }
    }

    // Sort by relevance score and limit to 5
    return validatedResults
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 5);
  },

  /**
   * Test the LLM connection and configuration
   * @returns {Promise<boolean>} - True if connection is successful
   */
  testConnection: async () => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY environment variable is not set');
        return false;
      }

      console.log('🧪 Testing LLM connection...');
      
      // Simple test with timeout
      const testPrompt = PromptTemplate.fromTemplate('Respond with exactly "CONNECTION_OK"');
      const testChain = testPrompt.pipe(llm);
      
      const response = await Promise.race([
        testChain.invoke({}),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection test timeout')), 10000)
        )
      ]);
      
      const isSuccessful = response.content.includes('CONNECTION_OK');
      console.log(isSuccessful ? '✅ LLM connection successful' : '❌ LLM connection failed');
      
      return isSuccessful;
    } catch (error) {
      console.error('❌ LLM connection test failed:', error.message);
      return false;
    }
  }
};

module.exports = llmService; 