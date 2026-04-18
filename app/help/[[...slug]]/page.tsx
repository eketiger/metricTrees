import { DocsPage, DocsBody, DocsTitle, DocsDescription } from 'fumadocs-ui/page';
import { helpSource } from '@/lib/docs-source';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';

interface Props {
  params: { slug?: string[] };
}

export default async function Page({ params }: Props) {
  const page = helpSource.getPage(params.slug);
  if (!page) notFound();
  const MDX = page.data.body;
  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={{ ...defaultMdxComponents }} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return helpSource.generateParams();
}

export function generateMetadata({ params }: Props) {
  const page = helpSource.getPage(params.slug);
  if (!page) return {};
  return { title: page.data.title, description: page.data.description };
}
