const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { JsonOutputParser } = require('@langchain/core/output_parsers');

// Initialize OpenAI LLM with enhanced configuration
const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: 0.1, // Very low temperature for consistent product matching
  maxTokens: 1000, // Limit response size
  timeout: 30000, // 30 second timeout
});

// Define the output schema for structured parsing
const outputParser = new JsonOutputParser();

// Enhanced Smart Product Assistant prompt template with advanced prompt engineering
const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful shopping assistant helping customers find the perfect products. Your goal is to explain why specific products match what the customer is looking for in a friendly, conversational way.

USER'S REQUEST: "{userQuery}"

AVAILABLE PRODUCTS:
{products}

INSTRUCTIONS FOR EXPLANATIONS:
- Write like you're personally recommending to a friend
- Focus on benefits and value, not technical matching
- Be specific about why this product fits their needs
- Keep explanations conversational and engaging (2-3 sentences)
- Avoid phrases like "matches your query" or "key matches"
- Sound natural and helpful, not robotic

EXPLANATION STYLE EXAMPLES:
✅ GOOD: "Perfect for gaming and creative work! This laptop delivers powerful performance with its RTX graphics and fast processor, plus it's portable enough for campus life."
✅ GOOD: "These headphones are ideal for your commute - excellent noise cancellation blocks out distractions, and the 30-hour battery means you won't need to charge them daily."
✅ GOOD: "A great choice for your home workout routine. The adjustable resistance and compact design make it perfect for small spaces, and it's built to last."

❌ AVOID: "Great match for your query! Key matches: Contains gaming, has RTX graphics, matches laptop category."
❌ AVOID: "This product matches your search criteria because it contains the requested keywords and features."

SCORING CRITERIA (1-10):
- 9-10: Perfect match for the user's specific needs
- 7-8: Very good match with minor limitations
- 5-6: Good option but may not be ideal
- 3-4: Okay alternative but missing key features
- 1-2: Poor fit for the user's needs

Only recommend products with scores of 5 or higher. If no products score 5+, return empty array [].

REQUIRED JSON FORMAT:
[
  {{
    "id": number,
    "explanation": "Natural, conversational explanation of why this product is great for them",
    "relevance_score": number
  }}
]

Maximum 5 products. Focus on the best matches.

JSON Response:
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

// Smart Product Assistant service with enhanced error handling
const llmService = {
  /**
   * Analyze user query and recommend relevant products with advanced matching
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

      // Enhanced product formatting for better LLM understanding
      const formattedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: `$${product.price}`,
        category: product.category,
        key_features: llmService._extractKeyFeatures(product.attributes),
        brand: product.attributes?.brand || 'Unknown'
      }));

      console.log(`🤖 LLM Request - Query: "${userQuery.substring(0, 50)}${userQuery.length > 50 ? '...' : ''}", Products: ${products.length}`);

      // Execute with retry logic
      const result = await llmService._executeWithRetry(async () => {
        const chain = promptTemplate.pipe(llm).pipe(outputParser);
        
        return await chain.invoke({
          userQuery: userQuery.trim(),
          products: JSON.stringify(formattedProducts, null, 2)
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