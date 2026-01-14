import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ | CSS Clip Path Generator - Common Questions Answered",
  description:
    "Frequently asked questions about CSS clip-path, bezier curves, polygon shapes, and our free online clip path generator tool. Learn how to create custom shapes for web design.",
  keywords: [
    "clip-path FAQ",
    "css clip path questions",
    "how to use clip-path",
    "bezier curve tutorial",
    "css polygon shape",
    "clip path examples",
    "css shape masking",
    "web design shapes",
    "css clipping path",
    "image masking css",
    "responsive clip path",
    "clip path animation",
    "svg clip path",
    "css custom shapes",
    "clip path browser support",
  ],
  openGraph: {
    title: "FAQ | CSS Clip Path Generator - Common Questions Answered",
    description:
      "Learn everything about CSS clip-path, bezier curves, and polygon shapes. Free online tool for creating custom clip paths.",
    url: "https://clippath.app/faq",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ | CSS Clip Path Generator - Common Questions Answered",
    description:
      "Learn everything about CSS clip-path, bezier curves, and polygon shapes. Free online tool for creating custom clip paths.",
  },
  alternates: {
    canonical: "https://clippath.app/faq",
  },
};

const faqs = [
  {
    question: "What is CSS clip-path and how does it work?",
    answer:
      "CSS clip-path is a powerful CSS property that allows you to create custom shapes by clipping an element to a specific region. It works by defining a clipping path using various shape functions like polygon(), circle(), ellipse(), or path(). Any part of the element outside the clipping region becomes invisible, enabling you to create unique visual effects, custom image masks, and creative web designs without using image editing software.",
  },
  {
    question: "How do I create a bezier curve clip-path?",
    answer:
      "To create a bezier curve clip-path, you can use the path() function with SVG path data, or use our free online bezier curve generator tool. Our visual editor allows you to add points, adjust bezier handles for smooth curves, and export the generated CSS code instantly. Simply upload an image, click to add points around your desired shape, and drag the control handles to create smooth, professional-looking curves.",
  },
  {
    question: "What is the difference between clip-path polygon and bezier curves?",
    answer:
      "A polygon clip-path uses straight lines between points, creating angular shapes like triangles, hexagons, or custom polygons. Bezier curves, on the other hand, use mathematical curves with control points to create smooth, flowing shapes. Polygons are simpler and have better browser support, while bezier curves offer more creative flexibility for organic shapes. Our clip path generator supports both, allowing you to choose the best option for your web design project.",
  },
  {
    question: "Is your clip-path generator free to use?",
    answer:
      "Yes! Our CSS clip-path generator is completely free to use with no registration required. You can create unlimited clip paths, export CSS code, and use the generated shapes in your personal and commercial web projects. There are no watermarks, no premium tiers, and no hidden costs. We believe in providing professional-grade web design tools accessible to everyone.",
  },
  {
    question: "What browsers support CSS clip-path?",
    answer:
      "CSS clip-path is supported in all modern browsers including Chrome, Firefox, Safari, Edge, and Opera. Basic shapes like polygon() have excellent support across all platforms. For older browsers, we provide fallback options and polygon approximations of bezier curves. Our generator automatically creates cross-browser compatible code to ensure your designs work everywhere.",
  },
  {
    question: "How do I animate a clip-path in CSS?",
    answer:
      "You can animate clip-path using CSS transitions or keyframe animations. Simply define two clip-path states and use the transition property to smoothly morph between them. For example: 'transition: clip-path 0.3s ease-in-out;'. Note that animating between different shape types (like polygon to circle) may not work smoothly - for best results, animate between shapes with the same number of points. Our tool helps you create compatible start and end states for smooth CSS animations.",
  },
  {
    question: "Can I use clip-path with images and responsive design?",
    answer:
      "Absolutely! CSS clip-path works perfectly with images and responsive layouts. Since clip-path values can use percentage units, your clipped shapes automatically scale with the element size. Our generator outputs percentage-based coordinates by default, making your clip paths fully responsive across all screen sizes and devices. This makes it ideal for modern responsive web design.",
  },
  {
    question: "What is the difference between clip-path and mask in CSS?",
    answer:
      "While both clip-path and CSS mask can hide parts of an element, they work differently. Clip-path creates a hard-edged clipping region - pixels are either fully visible or completely hidden. CSS mask, on the other hand, uses an image (like a gradient or SVG) to control transparency, allowing for soft edges and partial opacity. Clip-path is generally simpler and has better performance, while mask offers more creative possibilities for complex visual effects.",
  },
  {
    question: "How do I export and use the generated clip-path code?",
    answer:
      "Using our clip-path generator, simply create your desired shape, then click the Export button. You can copy the generated CSS clip-path property directly to your clipboard with one click. The code is ready to paste into your stylesheet. We also provide SVG path output for maximum flexibility. The generated code is clean, optimized, and follows best practices for web development.",
  },
  {
    question: "Can I create complex shapes like stars, hearts, or custom logos?",
    answer:
      "Yes! Our visual clip-path editor makes it easy to create any shape you can imagine. With bezier curve support and precise point control, you can create complex shapes like stars, hearts, speech bubbles, arrows, custom logos, and abstract designs. The intuitive interface lets you add unlimited points and fine-tune each curve for pixel-perfect results in your web design projects.",
  },
  {
    question: "What are the best practices for using clip-path in web design?",
    answer:
      "For optimal results with clip-path: 1) Use percentage values for responsive designs, 2) Keep shapes simple for better performance, 3) Provide fallbacks for older browsers, 4) Test on multiple devices, 5) Consider accessibility - ensure clipped content isn't essential information, 6) Use will-change property for animated clip paths, and 7) Combine with other CSS properties like filters and transforms for creative effects.",
  },
  {
    question: "How does your clip-path tool compare to Photoshop or Figma?",
    answer:
      "While Photoshop and Figma are powerful design tools, our clip-path generator is specifically built for web developers. Unlike exporting images from design software, our tool generates native CSS code that's resolution-independent, SEO-friendly, and loads instantly. You get real-time preview, direct CSS output, and the ability to iterate quickly without switching between applications. It's the perfect bridge between design and development.",
  },
  {
    question: "Can I save and reuse my clip-path projects?",
    answer:
      "Yes! Our clip-path generator automatically saves your projects to your browser's local storage. You can create multiple projects, name them, and switch between them at any time. Your work is preserved even if you close the browser, making it easy to iterate on designs over multiple sessions. No account required - your projects stay private on your device.",
  },
  {
    question: "What image formats work with your clip-path generator?",
    answer:
      "Our tool supports all common web image formats including PNG, JPG, JPEG, GIF, WebP, and SVG. Simply drag and drop your image or click to upload. The image serves as a visual reference while you create your clip path - the final CSS code works with any element type, not just images. You can apply the generated clip-path to divs, sections, or any HTML element.",
  },
  {
    question: "Is CSS clip-path good for SEO and web performance?",
    answer:
      "CSS clip-path is excellent for both SEO and performance. Unlike image-based solutions, clip-path doesn't require additional HTTP requests, reducing page load time. The CSS code is tiny compared to image masks, improving Core Web Vitals scores. Search engines can still access all content behind clip-path, making it SEO-friendly. It's a modern, performant approach to creative web design.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-zinc-900 text-zinc-100">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Editor
          </Link>

          <header className="mb-12">
            <h1 className="text-3xl font-semibold tracking-tight mb-4 text-zinc-100">
              Frequently Asked Questions
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Everything you need to know about CSS clip-path, bezier curves,
              and our free online clip path generator tool for modern web
              design.
            </p>
          </header>

          <section className="space-y-4">
            {faqs.map((faq, index) => (
              <article
                key={index}
                className="border border-zinc-700 rounded-lg p-5 bg-zinc-800/50 hover:border-zinc-500 transition-colors"
              >
                <h2 className="text-base font-medium mb-2 text-zinc-200">{faq.question}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {faq.answer}
                </p>
              </article>
            ))}
          </section>

          <section className="mt-12 border-t border-zinc-700 pt-10">
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">
              Ready to Create Your Own Clip Path?
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Start using our free CSS clip-path generator to create stunning
              bezier curves, polygons, and custom shapes for your web projects.
              No registration required.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/50 px-6 py-2 text-sm text-zinc-300 transition-all hover:border-zinc-500 hover:bg-zinc-700/50 hover:text-white"
            >
              Open Clip Path Generator
            </Link>
          </section>

          <footer className="mt-12 pt-6 border-t border-zinc-800 text-center text-xs text-zinc-500">
            <p>
              CSS Clip Path Generator - Free online tool for creating custom
              clip paths, bezier curves, and polygon shapes for web design and
              development.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
