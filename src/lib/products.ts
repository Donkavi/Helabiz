/**
 * Pricing and stock for products that may have variants.
 *
 * A product is priced one of two ways, never both: either by its own price,
 * compare-at, cost and stock, or — once it has variants — by each variant's.
 * In the second case the product-level fields are only a summary (cheapest
 * variant's prices, total stock) kept so lists, sorting and reports work
 * unchanged. Everything that needs a real figure goes through these helpers.
 */

export type VariantPricing = {
  price?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stock?: number | null;
};

export type ProductPricing = {
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stock?: number | null;
  variants?: VariantPricing[] | null;
};

export function hasVariants(product: { variants?: unknown[] | null }) {
  return (product.variants?.length ?? 0) > 0;
}

/**
 * One variant's figures. Variants saved before they had their own compare-at
 * and cost fall back to the product's cost, but never to its compare-at: a
 * "was" price only means something against the price it was set beside.
 */
export function variantPricing(product: ProductPricing, variant: VariantPricing) {
  return {
    price: variant.price ?? product.price,
    compareAtPrice: variant.compareAtPrice ?? undefined,
    costPrice: variant.costPrice ?? product.costPrice ?? 0,
    stock: variant.stock ?? 0,
  };
}

/** The product-level summary: its own figures, or ones derived from its variants. */
export function productSummary(product: ProductPricing) {
  if (!hasVariants(product)) {
    const price = product.price;
    return {
      price,
      maxPrice: price,
      compareAtPrice: product.compareAtPrice ?? undefined,
      costPrice: product.costPrice ?? 0,
      stock: product.stock ?? 0,
      stockValue: (product.stock ?? 0) * (product.costPrice ?? 0),
      retailValue: (product.stock ?? 0) * price,
    };
  }

  const variants = product.variants!.map((v) => variantPricing(product, v));
  const cheapest = variants.reduce((a, b) => (b.price < a.price ? b : a));
  return {
    price: cheapest.price,
    maxPrice: Math.max(...variants.map((v) => v.price)),
    compareAtPrice: cheapest.compareAtPrice,
    costPrice: cheapest.costPrice,
    stock: variants.reduce((sum, v) => sum + v.stock, 0),
    stockValue: variants.reduce((sum, v) => sum + v.stock * v.costPrice, 0),
    retailValue: variants.reduce((sum, v) => sum + v.stock * v.price, 0),
  };
}
