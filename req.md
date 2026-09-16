Build a **production-quality, premium Small Business SaaS platform for Sri Lankan businesses** called **Helabiz** using **Next.js**.

The platform combines two major products:

1. **Business Management System**
2. **No-Code Drag-and-Drop Website Builder**

The goal is to allow a Sri Lankan small-business owner to manage their entire business and create a beautiful professional website from the same platform.

The user should NOT need any coding knowledge.

---

# 1. Product Vision

Helabiz should allow a business owner to go from:

**"I sell products through WhatsApp/Instagram/Facebook"**

to:

**"I have my own professional website, manage my products and orders, and understand my business performance."**

The core experience should be:

```text
Create Account
      ↓
Create Business
      ↓
Add Products
      ↓
Create Website
      ↓
Customize Website
      ↓
Publish
      ↓
Receive Orders
      ↓
Manage Orders
      ↓
Track Sales / Expenses / Profit
```

The website builder must be a major feature of the platform.

---

# 2. VERY IMPORTANT — DESIGN QUALITY

The application must have a **very high-quality modern SaaS design**.

Do NOT create a generic dashboard that looks like a basic Bootstrap admin panel.

The design quality should feel comparable to modern products such as:

* Shopify
* Wix
* Squarespace
* Framer
* Webflow
* Stripe
* Linear
* Notion

The UI should feel:

* Premium
* Modern
* Minimal
* Elegant
* Fast
* Professional
* Easy to understand
* Visually impressive

Pay special attention to:

* Typography
* Spacing
* Alignment
* Color hierarchy
* Component consistency
* Micro-interactions
* Hover states
* Animations
* Empty states
* Loading states
* Responsive behavior

Do not overuse gradients, shadows, glassmorphism, or unnecessary animations.

The design should feel professional rather than flashy.

---

# 3. Technology Stack

Use:

* Next.js latest stable version
* App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide icons
* MongoDB
* Mongoose
* Auth.js / NextAuth
* React Hook Form
* Zod
* Recharts
* dnd-kit for drag-and-drop functionality

Use clean architecture.

Use reusable components.

Use Server Components wherever possible.

Use Client Components only when interaction requires them.

---

# 4. Main Application Sections

The application should have:

```text
Dashboard
Orders
Products
Inventory
Customers
Expenses
Invoices
Reports

Website
  ├── Overview
  ├── Pages
  ├── Website Builder
  ├── Themes
  ├── Navigation
  ├── Domains
  └── Settings

Settings
```

The website builder should have its own dedicated experience.

---

# 5. Website Builder — CORE FEATURE

Create a powerful **drag-and-drop no-code website builder**.

The user should be able to visually create their website.

The builder should work similarly to:

* Wix
* Squarespace
* Shopify Theme Editor
* Framer

But keep it significantly simpler for small-business owners.

---

# 6. Website Builder Layout

Create a professional website builder interface.

Desktop layout:

```text
┌──────────────────────────────────────────────────────────┐
│ Logo       Preview   Undo   Redo      Save    Publish   │
├───────────────┬──────────────────────────┬───────────────┤
│               │                          │               │
│ COMPONENTS    │       WEBSITE CANVAS    │   SETTINGS    │
│               │                          │               │
│ Hero          │                          │ Text          │
│ Gallery       │                          │ Font          │
│ Slider        │                          │ Color         │
│ Cards         │                          │ Spacing       │
│ Products      │                          │ Background    │
│ Text          │                          │ Layout        │
│ Image         │                          │ Animation     │
│ Button        │                          │               │
│ Testimonials  │                          │               │
│ Contact       │                          │               │
│ Footer        │                          │               │
└───────────────┴──────────────────────────┴───────────────┘
```

The editor must feel polished and intuitive.

---

# 7. Drag-and-Drop System

Users should be able to:

* Drag components from the component library
* Drop components onto the page
* Rearrange components
* Duplicate components
* Delete components
* Move sections up/down
* Edit component content
* Resize where appropriate
* Change spacing
* Change alignment
* Change colors
* Change typography
* Change backgrounds

When hovering over the website canvas, clearly indicate where the component will be inserted.

Use smooth drag-and-drop animations.

---

# 8. Component Library

Create a component library on the left side.

Categories:

### Layout

* Section
* Container
* Columns
* Grid
* Spacer

### Content

* Heading
* Paragraph
* Rich Text
* Image
* Video
* Button
* Divider

### Marketing

* Hero
* Call to Action
* Features
* Testimonials
* Statistics
* FAQ
* Announcement Banner

### Media

* Image Gallery
* Image Slider
* Carousel
* Video Section

### Commerce

* Product Grid
* Product Card
* Featured Product
* Product Categories
* Pricing Card
* Shopping CTA

### Business

* About Us
* Services
* Team
* Contact
* Location
* Business Hours
* Social Links

### Navigation

* Header
* Navigation Menu
* Footer

---

# 9. HERO COMPONENT

Create a highly customizable Hero component.

Options:

Layout:

* Text left / image right
* Text right / image left
* Centered
* Full-screen background

Fields:

Heading

Subheading

Button text

Button URL

Secondary button

Background image

Overlay

Alignment

Text width

Height

Spacing

Animation

Example:

```text
YOUR STYLE.
YOUR STORE.
YOUR WEBSITE.

Discover our latest collection.

[Shop Now] [Contact Us]
```

---

# 10. IMAGE GALLERY COMPONENT

Create a beautiful gallery component.

Layouts:

* Grid
* Masonry
* 2-column
* 3-column
* 4-column
* Horizontal scroll

Features:

* Upload images
* Select images from gallery
* Drag to reorder
* Image captions
* Image links
* Border radius
* Spacing
* Hover effects

Allow lightbox preview on the published website.

---

# 11. IMAGE SLIDER COMPONENT

Create a fully configurable slider.

Features:

* Multiple slides
* Image
* Heading
* Description
* Button
* Auto-play
* Slide duration
* Navigation arrows
* Dots
* Transition style
* Desktop/mobile settings

The slider must look premium.

---

# 12. CARD COMPONENT

Create flexible cards.

Cards can contain:

* Image
* Icon
* Title
* Description
* Price
* Button
* Link

Allow users to create:

2-column cards

3-column cards

4-column cards

Examples:

Services

Products

Features

Categories

Pricing

---

# 13. PRODUCT COMPONENTS

This is very important because the website connects to the business database.

Create:

### Product Grid

Automatically load products from the business database.

Options:

* Number of columns
* Products per page
* Category filter
* Sorting
* Price display
* Sale badge
* Add to cart

### Product Card

Show:

Image

Product name

Price

Discount

Stock status

Button

### Featured Products

Allow the business owner to select specific products.

---

# 14. WEBSITE PAGES

Users should be able to create multiple pages.

Default pages:

Home

Shop

About

Contact

Custom Page

Users can:

* Create page
* Rename page
* Duplicate page
* Delete page
* Hide page
* Reorder pages

Example:

```text
Home
Shop
About Us
Services
Gallery
Contact
```

---

# 15. PAGE BUILDER

Each page should contain sections.

Example:

```text
Home

Hero
↓
Featured Products
↓
About Business
↓
Image Gallery
↓
Testimonials
↓
Call To Action
↓
Footer
```

Every section must be draggable.

Users can reorder sections using drag-and-drop.

---

# 16. SECTION SETTINGS

Every component should have a settings panel.

Allow:

### Content

Text

Images

Links

Buttons

Products

### Layout

Width

Height

Padding

Margin

Columns

Alignment

### Appearance

Background

Text color

Border

Border radius

Shadow

### Typography

Font

Size

Weight

Line height

Letter spacing

### Responsive

Desktop settings

Tablet settings

Mobile settings

This is important.

---

# 17. RESPONSIVE WEBSITE BUILDER

Add viewport controls:

Desktop

Tablet

Mobile

When the user selects mobile, show the website in a mobile preview.

Allow responsive configuration where necessary.

The published website must be fully responsive.

---

# 18. THEMES

Provide professionally designed themes.

Examples:

### Fashion

Luxury fashion store

### Restaurant

Modern restaurant

### Bakery

Warm bakery

### Beauty

Minimal beauty brand

### Electronics

Modern technology store

### Photography

Portfolio

### Services

Professional services

### Personal Brand

Creator/business owner

Each theme should contain:

* Typography
* Colors
* Buttons
* Cards
* Header
* Footer
* Default page layouts

Users can start from a theme and customize it.

---

# 19. THEME CUSTOMIZATION

Create a global theme settings panel.

Users can customize:

Primary color

Secondary color

Background

Text color

Heading font

Body font

Button style

Border radius

Section spacing

Card style

Header style

Footer style

Do not require users to understand CSS.

---

# 20. TEMPLATE SYSTEM

Create reusable templates.

Users can choose:

**Start from scratch**

or:

**Use a template**

Templates:

Modern Fashion Store

Sri Lankan Bakery

Home Business

Beauty Salon

Restaurant

Electronics Shop

Portfolio

Service Business

---

# 21. IMAGE MANAGEMENT

Create a media library.

Users can:

* Upload images
* Delete images
* Search images
* Select images
* Reuse images
* Organize images

The media library should be accessible from every image component.

---

# 22. WEBSITE PREVIEW

Provide:

**Preview**

button.

Preview should open the actual website without editor controls.

Provide:

Desktop preview

Tablet preview

Mobile preview

---

# 23. PUBLISH WEBSITE

Add a prominent:

**Publish**

button.

When publishing:

Show:

"Your website is ready!"

Generate a public URL such as:

```text
business-name.Helabiz.lk
```

Design the architecture so custom domains can be added later.

---

# 24. PUBLIC WEBSITE

The published website must NOT look like the SaaS dashboard.

It should look like a professional business website.

No editor UI.

No admin controls.

Fast loading.

SEO-friendly.

Mobile responsive.

Use clean URLs:

```text
/shop
/about
/contact
/products/classic-t-shirt
```

---

# 25. E-COMMERCE FUNCTIONALITY

Allow businesses to sell directly through their website.

Product page:

Image gallery

Product name

Description

Price

Variants

Stock

Quantity

Add to cart

Buy now

Related products

---

# 26. CART

Create:

Cart drawer

Cart page

Quantity controls

Remove item

Subtotal

Delivery fee

Discount

Total

Checkout

---

# 27. CHECKOUT

Create a simple Sri Lankan-friendly checkout.

Fields:

Name

Phone number

Email

Address

City

District

Order notes

Payment method

Payment methods initially:

Cash on Delivery

Bank Transfer

Online Payment placeholder

Design payment architecture so local payment gateways can be integrated later.

---

# 28. WEBSITE ORDERS

Orders created from the public website must automatically appear in the main:

**Orders**

section.

Example:

Website Order

#ORD-1035

Customer:
Tharushi Silva

Product:
Oversized T-Shirt

Total:
Rs. 4,850

Status:
Pending

---

# 29. WEBSITE ANALYTICS

Create:

Website visitors

Page views

Product views

Add to cart

Orders

Conversion rate

Revenue

Top pages

Top products

Initially create a simple analytics architecture with mock/demo data where real tracking is not implemented.

---

# 30. SEO BUILDER

For every page allow:

Page title

Meta description

OG image

URL slug

SEO keywords

The website should generate proper:

title

description

OpenGraph metadata

canonical URLs

sitemap

robots.txt

---

# 31. AI WEBSITE GENERATOR

Design an architecture for a future AI feature:

**"Create my website with AI"**

The user enters:

> "I run a women's clothing business in Colombo called Kavi Fashion. We sell modern casual clothing."

AI could generate:

* Website structure
* Hero text
* About section
* Product sections
* Color palette
* Suggested images
* Call-to-action text

Create the UI and service abstraction for this feature, but if no AI API key is available, use mock generation.

---

# 32. Business Management

The existing business management system should include:

Dashboard

Orders

Products

Inventory

Customers

Expenses

Invoices

Reports

All website orders must connect to the same business data.

---

# 33. Dashboard

Show:

Today's Sales

Orders

Expenses

Profit

Website Visitors

Website Orders

Conversion Rate

Low Stock

Recent Orders

Top Products

Sales chart

Profit chart

---

# 34. Products

Products created in the dashboard should automatically become available in the website builder's:

**Product Grid**

**Featured Products**

**Product Card**

components.

The user should NOT need to add the same product twice.

---

# 35. Customers

Customers who order from the website should automatically be added to the customer database.

Track:

Name

Phone

Email

Address

Orders

Total spending

Last order

Customer type

---

# 36. Inventory

Website orders should automatically reduce inventory.

Example:

Stock:

20

Customer buys:

2

New stock:

18

Record the inventory movement.

---

# 37. Expenses

Allow users to record:

Rent

Salary

Marketing

Packaging

Delivery

Inventory

Utilities

Transport

Other

---

# 38. Reports

Provide:

Sales

Profit

Expenses

Products

Customers

Inventory

Website performance

Allow CSV export.

---

# 39. Invoice Generator

Generate professional invoices.

Invoice should include:

Business logo

Business name

Address

Phone

Customer

Invoice number

Items

Quantity

Price

Discount

Delivery

Total

Payment status

---

# 40. WhatsApp Integration

Every order should have:

**Send via WhatsApp**

Generate a professional WhatsApp message.

Example:

```text
Hello Tharushi,

Thank you for your order.

Order #ORD-1035

Oversized T-Shirt × 1
Rs. 4,500

Delivery
Rs. 350

Total
Rs. 4,850

Thank you for shopping with us.
```

Use WhatsApp deep linking initially.

---

# 41. Subscription Plans

### Free

Rs. 0/month

* 20 orders
* 50 products
* Basic website
* Limited templates
* Helabiz subdomain

### Starter

Rs. 999/month

* Unlimited orders
* 500 products
* Full website builder
* More templates
* Custom pages
* Analytics
* Invoices
* WhatsApp tools

### Business

Rs. 2,499/month

* Unlimited products
* Unlimited orders
* Advanced analytics
* AI website generation
* Multiple users
* Custom domain support
* Priority support

Create subscription architecture so local payment providers can be integrated later.

---

# 42. Database Architecture

Create MongoDB schemas for:

User

Business

BusinessMember

Product

ProductVariant

Category

Order

OrderItem

Customer

Expense

Invoice

InventoryMovement

Website

WebsitePage

WebsiteSection

WebsiteTheme

Media

Domain

Subscription

Payment

Notification

AuditLog

---

# 43. Website JSON Structure

The website builder should NOT store raw HTML as the primary representation.

Store a structured JSON/page schema.

Example:

```text
Website
 └── Pages
      └── Home
           ├── Hero
           ├── ProductGrid
           ├── Gallery
           ├── Testimonials
           └── CTA
```

Each component should have:

```text
id
type
props
styles
responsiveStyles
children
```

Example concept:

```text
{
  type: "hero",
  props: {
    title: "...",
    description: "...",
    buttonText: "...",
    image: "..."
  },
  styles: {
    background: "...",
    padding: "..."
  }
}
```

Create a renderer that converts this schema into React components.

---

# 44. Component Architecture

Create reusable website builder components:

```text
WebsiteRenderer
SectionRenderer
HeroSection
TextSection
ImageSection
GallerySection
SliderSection
CardSection
ProductGridSection
ProductCard
TestimonialsSection
ServicesSection
ContactSection
CTASection
HeaderSection
FooterSection
```

The editor and public website should use the same component definitions wherever practical.

---

# 45. Undo / Redo

The builder must support:

Undo

Redo

Keyboard shortcuts:

Ctrl + Z

Ctrl + Shift + Z

Create a proper editor history system.

---

# 46. Autosave

Automatically save changes.

Show:

"Saving..."

then:

"Saved"

Do not lose the user's website changes if they accidentally refresh.

---

# 47. Draft / Published State

Website should support:

Draft

Published

When editing:

Changes affect draft.

Only clicking:

**Publish**

updates the public website.

---

# 48. Version Safety

Before publishing, optionally show:

"Publish changes?"

After publishing:

"Website published successfully."

---

# 49. Authentication and Security

Implement:

* Secure authentication
* Authorization
* Business-level permissions
* Server-side validation
* Zod validation
* Secure cookies
* Password hashing
* Rate limiting architecture
* Input validation
* No secrets exposed to browser
* Environment variables
* Multi-tenant data isolation

Every business-related database query must verify the current user's access to the business.

---

# 50. Multi-Tenant Architecture

A user can own multiple businesses.

Example:

Kavindu:

* Kavi Fashion
* Kavindu Cosmetics

Each business must have isolated:

Products

Orders

Customers

Expenses

Inventory

Websites

Analytics

Users must NEVER be able to access another business's data.

---

# 51. Mobile Application Experience

The dashboard must work extremely well on mobile.

However, the **website builder should initially be optimized primarily for desktop/tablet**, because complex drag-and-drop editing is difficult on small screens.

The published websites MUST be fully mobile responsive.

---

# 52. Landing Page

Create a premium marketing website for Helabiz.

Hero:

**Your Business. Your Website. One Simple Platform.**

Subheading:

"Manage your products, orders, customers and profits — and build your own professional website without writing code."

Buttons:

**Start Free**

**Create a Website**

Hero visual:

Show a beautiful mockup of the website builder with a website being edited.

---

# 53. Landing Page Sections

Include:

Problem

Solution

Website Builder

Business Management

Templates

How It Works

Features

Pricing

Testimonials

FAQ

Final CTA

---

# 54. Website Builder Showcase

Create an impressive section demonstrating:

```text
Drag
 ↓
Drop
 ↓
Customize
 ↓
Publish
```

Show component examples:

Hero

Gallery

Slider

Product Cards

Testimonials

CTA

---

# 55. Pricing Page

Create beautiful pricing cards.

Free

Starter

Business

Highlight Starter as:

**Most Popular**

Make the pricing page visually excellent.

---

# 56. Empty States

Every module must have polished empty states.

Example:

"No website yet"

"Create your first website and start showing your products to the world."

Button:

**Create Website**

---

# 57. Loading States

Use skeleton loaders.

Do not display blank screens.

---

# 58. Animations

Use subtle animations for:

* Dragging
* Dropping
* Page transitions
* Modals
* Buttons
* Toasts
* Hover states
* Builder interactions

Do not make animations excessive.

---

# 59. Accessibility

Follow good accessibility practices.

Use:

* Semantic HTML
* Keyboard navigation
* ARIA labels
* Accessible forms
* Focus states
* Sufficient contrast

---

# 60. Performance

Optimize:

* Images
* Database queries
* Server rendering
* Client-side JavaScript
* Lazy loading
* Website rendering

Public websites should load very quickly.

Use Next.js image optimization.

---

# 61. Developer Structure

Use a clean structure such as:

```text
app/
  (marketing)/
  (auth)/
  dashboard/
  orders/
  products/
  customers/
  inventory/
  expenses/
  invoices/
  reports/

  website/
    builder/
    pages/
    themes/
    domains/
    settings/

  site/
    [businessSlug]/

components/
  ui/
  dashboard/
  website-builder/
  website/
  charts/

lib/
  auth/
  db/
  permissions/
  validations/
  website/
  analytics/
  utils/

models/
  User.ts
  Business.ts
  Product.ts
  Order.ts
  Customer.ts
  Expense.ts
  Website.ts
  WebsitePage.ts
  WebsiteSection.ts

services/

types/

public/
```

---

# 62. Important Development Rule

Do NOT build this as a static frontend mockup.

Implement real:

* Authentication
* Database
* CRUD
* Website builder state
* Drag-and-drop
* Website JSON schema
* Autosave
* Draft/publish
* Products
* Orders
* Customers
* Inventory
* Expenses
* Dashboard calculations

Where an external service is required, create an abstraction and mock implementation.

---

# 63. Development Priority

Build in this order.

### Phase 1 — Foundation

Authentication

Business creation

Dashboard

Database

Multi-tenancy

---

### Phase 2 — Business Management

Products

Customers

Orders

Inventory

Expenses

Profit calculations

---

### Phase 3 — Website Builder

Website creation

Template selection

Drag-and-drop

Components

Sections

Pages

Theme editor

Media library

Preview

Autosave

Undo/redo

Draft/publish

---

### Phase 4 — E-commerce Website

Product pages

Cart

Checkout

Website orders

Inventory synchronization

Customer synchronization

---

### Phase 5 — Business Features

Invoices

Reports

WhatsApp

Analytics

---

### Phase 6 — Monetization

Subscriptions

Usage limits

Plan management

Payment abstraction

---

### Phase 7 — Advanced Features

AI website generator

Custom domains

Advanced analytics

Multiple staff accounts

---

# 64. Final Quality Requirement

The final product must feel like a **real commercial SaaS startup**, not a university project.

The most important areas are:

**1. Excellent UI/UX**

**2. Extremely easy website creation**

**3. Smooth drag-and-drop experience**

**4. Beautiful website templates**

**5. Strong connection between website and business management**

**6. Mobile-responsive published websites**

**7. Fast performance**

**8. Clean and maintainable code**

A small-business owner should be able to sign up, choose a template, add their products, customize their homepage, and publish a professional website without knowing anything about programming.

The experience should feel:

**"I can build my business website myself."**

rather than:

**"I am using complicated website-building software."**
