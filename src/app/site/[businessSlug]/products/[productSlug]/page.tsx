import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { loadPublishedSite } from "@/lib/website/load-site";
import { toPublicProduct } from "@/services/website-service";
import { siteUrlFor } from "@/lib/website/urls";
import { WebsiteRenderer } from "@/components/website/website-renderer";
import { ProductDetail } from "@/components/website/product-detail";

async function loadProduct(businessId: string, slug: string) {
  await connectDB();
  const product = await Product.findOne({ businessId, slug, status: "active" }).lean();
  return product ? toPublicProduct(product) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { businessSlug, productSlug } = await params;
  const site = await loadPublishedSite(businessSlug);
  if (!site) return { title: "Not found" };

  const product = await loadProduct(site.businessId, productSlug);
  if (!product) return { title: "Product not found" };

  const description = product.shortDescription ?? product.description?.slice(0, 180);

  return {
    title: product.name,
    description,
    alternates: { canonical: siteUrlFor(businessSlug, `/products/${product.slug}`) },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      images: product.images?.length ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ businessSlug: string; productSlug: string }>;
}) {
  const { businessSlug, productSlug } = await params;
  const site = await loadPublishedSite(businessSlug);
  if (!site) notFound();

  const product = await loadProduct(site.businessId, productSlug);
  if (!product) notFound();

  const related = site.ctx.products
    .filter((p) => p.id !== product.id && (!product.categoryId || p.categoryId === product.categoryId))
    .slice(0, 4);

  // Structured data so the product can show a price and availability in search.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    image: product.images?.length ? product.images : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: product.price,
      availability:
        !product.trackInventory || product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: siteUrlFor(businessSlug, `/products/${product.slug}`),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <WebsiteRenderer sections={[]} header={site.header} footer={site.footer} ctx={site.ctx} mode="public">
        <ProductDetail product={product} related={related} ctx={site.ctx} />
      </WebsiteRenderer>
    </>
  );
}
