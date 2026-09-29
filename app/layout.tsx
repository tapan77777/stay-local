import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { JsonLd } from "@/components/site/jsonld";
import { buildMetadata, orgJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  ...buildMetadata({
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    path: "/",
  }),
  metadataBase: new URL(site.url),
  applicationName: site.name,
  authors: [{ name: site.founder.name }],
  creator: site.founder.name,
  keywords: [
    "India travel planning",
    "India trip planner",
    "India travel advisor",
    "personalized India itinerary",
    "India travel expert",
    "India travel for Americans",
    "India travel first time visitors",
    "India travel scams",
  ],
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${dmSans.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-cream text-charcoal">
        <JsonLd data={orgJsonLd()} />
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
