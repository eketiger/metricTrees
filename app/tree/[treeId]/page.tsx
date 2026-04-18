import prisma from '@/prisma/client';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

const TreeEditor = dynamic(() => import('@/app/components/TreeEditor').then((m) => m.TreeEditor), {
  ssr: false,
});

export default async function TreePage({ params }: { params: Promise<{ treeId: string }> }) {
  const { treeId } = await params;
  const tree = await prisma.metricTree.findUnique({ where: { id: treeId } }).catch(() => null);
  if (!tree) {
    // Fall back to showing empty editor for brand-new trees that haven't persisted.
    return <TreeEditor treeId={treeId} />;
  }
  return (
    <TreeEditor
      treeId={tree.id}
      initialTitle={tree.title}
      initialStatus={(tree.status as 'draft' | 'published' | 'archived') ?? 'draft'}
    />
  );
}
