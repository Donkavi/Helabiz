import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TEMPLATES } from "@/lib/website/templates";
import { decorateForPreview, demoSiteContext } from "@/lib/website/demo-data";
import { TemplatePreview, type PreviewPage } from "./template-preview";

/** Templates are defined in code, so every preview can be prerendered. */
export function generateStaticParams() {
  return TEMPLATES.map((template) => ({ templateId: template.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) return { title: "Template not found" };

  return {
    title: `${template.name} template`,
    description: `${template.description} Preview the ${template.name} website template and start building on Helabiz for free.`,
    alternates: { canonical: `/templates/${template.id}` },
  };
}

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) notFound();

  const pages: PreviewPage[] = template.pages.map((page) => ({
    title: page.title,
    slug: page.slug,
    isHome: Boolean(page.isHome),
    sections: decorateForPreview(page.sections, template.category),
  }));

  return (
    <TemplatePreview
      templateId={template.id}
      name={template.name}
      category={template.category}
      description={template.description}
      pages={pages}
      header={decorateForPreview(template.header, template.category)}
      footer={decorateForPreview(template.footer, template.category)}
      ctx={demoSiteContext(template)}
    />
  );
}
