import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#141414",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://itscloudcode.vercel.app"),
  title: {
    default: "CloudCode | The Mobile-First Cloud IDE & Engineering Workspace",
    template: "%s | CloudCode",
  },
  description: "Spin up isolated Linux containers, run real-time terminals, access autonomous AI coding companions, and manage Git workflows directly from your mobile device or web browser.",
  keywords: [
    "CloudCode",
    "Cloud IDE",
    "Mobile IDE",
    "Cloud Development Environment",
    "CDE",
    "Mobile Code Editor",
    "Mobile Programming",
    "Docker Container IDE",
    "AI Code Companion",
    "Mobile Git Client",
    "Online Terminal",
    "Linux Cloud Container",
    "Mobile Pull Requests",
  ],
  authors: [{ name: "CloudCode, Inc.", url: "https://itscloudcode.vercel.app" }],
  creator: "CloudCode, Inc.",
  publisher: "CloudCode, Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://itscloudcode.vercel.app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "CloudCode | The Mobile-First Cloud IDE & Engineering Workspace",
    description: "A professional cloud IDE, autonomous AI agents, and isolated Linux containers engineered specifically for mobile devices and web browsers.",
    url: "https://itscloudcode.vercel.app",
    siteName: "CloudCode",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/assets/playstorelogo.png",
        width: 512,
        height: 512,
        alt: "CloudCode Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CloudCode | The Mobile-First Engineering Workspace",
    description: "A professional cloud IDE, autonomous AI agents, and isolated Linux containers engineered specifically for mobile devices.",
    images: ["/assets/playstorelogo.png"],
  },
  icons: {
    icon: "/assets/cloudcodeicon.svg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://itscloudcode.vercel.app/#webapp",
      "name": "CloudCode",
      "url": "https://itscloudcode.vercel.app",
      "description": "A professional cloud IDE, autonomous AI agents, and isolated Linux containers engineered specifically for mobile devices and web browsers.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "iOS, Android, Web, Linux, macOS, Windows",
      "softwareVersion": "1.0.0",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "author": {
        "@type": "Organization",
        "name": "CloudCode, Inc.",
        "url": "https://itscloudcode.vercel.app",
        "email": "cloudcodeservice@gmail.com",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://itscloudcode.vercel.app/#organization",
      "name": "CloudCode, Inc.",
      "url": "https://itscloudcode.vercel.app",
      "logo": "https://itscloudcode.vercel.app/cloudcodelogolight.png",
      "email": "cloudcodeservice@gmail.com",
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "cloudcodeservice@gmail.com",
        "contactType": "customer support",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
