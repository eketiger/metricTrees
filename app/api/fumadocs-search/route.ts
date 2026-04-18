import { docsSource, helpSource } from '@/lib/docs-source';
import { createSearchAPI } from 'fumadocs-core/search/server';

export const { GET } = createSearchAPI('advanced', {
  indexes: [
    ...docsSource.getPages().map((page) => ({
      title: page.data.title,
      description: page.data.description ?? '',
      url: page.url,
      id: page.url,
      structuredData: page.data.structuredData,
    })),
    ...helpSource.getPages().map((page) => ({
      title: page.data.title,
      description: page.data.description ?? '',
      url: page.url,
      id: page.url,
      structuredData: page.data.structuredData,
    })),
  ],
});
