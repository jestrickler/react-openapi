import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  // Use the Petstore API for testing
  input: 'https://petstore.swagger.io/v2/swagger.json',
  output: 'app/api/generated',
  plugins: [
    '@hey-api/client-fetch',
    {
      name: '@tanstack/react-query',
      queryOptions: true, // This is the "magic" bridge for RRv7 loaders
    },
  ],
});