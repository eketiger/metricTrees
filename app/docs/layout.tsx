import { DocsLayout } from 'fumadocs-ui/layout';
import { docsSource } from '@/lib/docs-source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={docsSource.pageTree}
      nav={{ title: 'Metrics Docs' }}
      sidebar={{ collapsible: true, defaultOpenLevel: 1 }}
    >
      {children}
    </DocsLayout>
  );
}
