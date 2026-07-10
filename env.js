/**
 * DisasterNet AI — Environment Configuration
 * 
 * In a production deployment this file would be generated at build-time
 * from your .env file (e.g., via Vite/Webpack/dotenv-webpack).
 * 
 * For local development, copy .env.example to .env and fill in your keys,
 * then update the values below accordingly.
 * 
 * NEVER commit real API keys to source control.
 */

window.ENV = {
  // IBM Watsonx.ai
  WATSONX_API_KEY:     "",   // Set from .env: WATSONX_API_KEY
  WATSONX_PROJECT_ID:  "",   // Set from .env: WATSONX_PROJECT_ID
  WATSONX_BASE_URL:    "https://us-south.ml.cloud.ibm.com",
  WATSONX_MODEL_ID:    "ibm/granite-13b-chat-v2",
  IBM_IAM_URL:         "https://iam.cloud.ibm.com/identity/token",

  // Weather API
  WEATHER_API_KEY:     "",   // Set from .env: WEATHER_API_KEY
  WEATHER_BASE_URL:    "https://api.openweathermap.org/data/2.5",

  // Map tiles
  MAPTILER_API_KEY:    "",   // Optional: Set from .env: MAPTILER_API_KEY
};
