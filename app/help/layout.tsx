import { DocsLayout } from 'fumadocs-ui/layout';
import { helpSource } from '@/lib/docs-source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={helpSource.pageTree}
      nav={{ title: 'Help Center' }}
      sidebar={{ collapsible: true, defaultOpenLevel: 1 }}
    >
      {children}
    </DocsLayout>
  );
}
