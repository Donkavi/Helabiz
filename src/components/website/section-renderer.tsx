"use client";

import * as React from "react";
import type { SectionNode } from "@/types";
import type { SiteContext } from "@/lib/website/render-types";
import { mergeStyles } from "@/lib/website/styles";
import { SiteImage } from "./primitives";
import {
  AnnouncementSection,
  CtaSection,
  FaqSection,
  FeaturesSection,
  HeroSection,
  StatsSection,
  TestimonialsSection,
} from "./sections/marketing";
import {
  ButtonSection,
  ColumnsSection,
  DividerSection,
  GridSection,
  HeadingSection,
  ImageSection,
  LayoutSection,
  ParagraphSection,
  RichTextSection,
  SpacerSection,
  VideoSection,
} from "./sections/content";
import { CarouselSection, GallerySection, SliderSection, VideoBlockSection } from "./sections/media";
import {
  CardsSection,
  CategoriesSection,
  FeaturedProductSection,
  PricingSection,
  ProductGridSection,
  ShoppingCtaSection,
} from "./sections/commerce";
import {
  AboutSection,
  ContactSection,
  HoursSection,
  LocationSection,
  ServicesSection,
  SocialSection,
  TeamSection,
} from "./sections/business";
import { FooterSection, HeaderSection, NavMenuSection } from "./sections/navigation";

type SectionComponent = React.ComponentType<{ node: SectionNode; ctx: SiteContext; children?: React.ReactNode }>;

/**
 * Maps a node's `type` to the component that draws it. The same map powers the
 * builder canvas and the published website (spec §44).
 */
export const SECTION_COMPONENTS: Record<string, SectionComponent> = {
  // Layout
  section: LayoutSection,
  container: LayoutSection,
  columns: ColumnsSection,
  grid: GridSection,
  spacer: SpacerSection,
  // Content
  heading: HeadingSection,
  paragraph: ParagraphSection,
  richtext: RichTextSection,
  image: ImageSection,
  video: VideoSection,
  button: ButtonSection,
  divider: DividerSection,
  // Marketing
  hero: HeroSection,
  cta: CtaSection,
  features: FeaturesSection,
  testimonials: TestimonialsSection,
  stats: StatsSection,
  faq: FaqSection,
  announcement: AnnouncementSection,
  // Media
  gallery: GallerySection,
  slider: SliderSection,
  carousel: CarouselSection,
  "video-section": VideoBlockSection,
  // Commerce
  "product-grid": ProductGridSection,
  "featured-product": FeaturedProductSection,
  categories: CategoriesSection,
  cards: CardsSection,
  pricing: PricingSection,
  "shopping-cta": ShoppingCtaSection,
  // Business
  about: AboutSection,
  services: ServicesSection,
  team: TeamSection,
  contact: ContactSection,
  location: LocationSection,
  hours: HoursSection,
  social: SocialSection,
  // Navigation
  header: HeaderSection,
  footer: FooterSection,
  "nav-menu": NavMenuSection,
};

/**
 * Renders a single node. Styling is applied via the compiled stylesheet keyed on
 * `data-sid`, not inline, so responsive rules work on the published site.
 */
export function SectionRenderer({ node, ctx }: { node: SectionNode; ctx: SiteContext }) {
  const Component = SECTION_COMPONENTS[node.type];
  const style = mergeStyles(node, ctx.viewport);

  if (!Component) {
    return (
      <div data-sid={node.id} className="w-sec" style={{ padding: 24, textAlign: "center" }}>
        <p className="w-muted">Unknown section: {node.type}</p>
      </div>
    );
  }

  const hasBackgroundImage = Boolean(style.backgroundImage) && node.type !== "hero";

  const children = node.children?.length
    ? node.children.map((child) => <SectionRenderer key={child.id} node={child} ctx={ctx} />)
    : undefined;

  return (
    <section
      data-sid={node.id}
      data-type={node.type}
      data-anim={!ctx.editor && style.animation && style.animation !== "none" ? style.animation : undefined}
      className="w-sec"
    >
      {hasBackgroundImage && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <SiteImage src={style.backgroundImage} alt="" className="w-img" />
          <span className="w-overlay" />
        </div>
      )}
      <Component node={node} ctx={ctx}>
        {children}
      </Component>
    </section>
  );
}

export function SectionList({ nodes, ctx }: { nodes: SectionNode[]; ctx: SiteContext }) {
  return (
    <>
      {nodes.map((node) => (
        <SectionRenderer key={node.id} node={node} ctx={ctx} />
      ))}
    </>
  );
}
