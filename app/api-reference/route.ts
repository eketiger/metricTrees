import { ApiReference } from '@scalar/nextjs-api-reference';

export const GET = ApiReference({
  spec: { url: '/openapi.yaml' },
  theme: 'default',
  layout: 'modern',
  darkMode: true,
  metaData: {
    title: 'Metrics API Reference',
    description: 'Interactive API reference for the Metrics platform.',
  },
  authentication: { preferredSecurityScheme: 'bearerAuth' },
});
