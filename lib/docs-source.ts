import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';
import { docs, help } from '@/.source';

export const docsSource = loader({
  baseUrl: '/docs',
  source: createMDXSource(docs),
});

export const helpSource = loader({
  baseUrl: '/help',
  source: createMDXSource(help),
});
