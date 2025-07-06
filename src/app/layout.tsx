import PWAWrapper from "@/components/PWAWrapper";
import { MUIThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://vitaena.com'), // Replace with your actual domain
  title: "Vitaena - Privacy-First Local Resume Builder",
  description: "Create professional resumes locally in your browser. 100% private, works offline, no AI text generation. Multiple templates, PDF export, no watermarks.",
  keywords: [
    "resume builder",
    "CV maker",
    "privacy-first",
    "offline resume",
    "free resume builder",
    "open source"
  ],
  openGraph: {
    title: 'Vitaena - Privacy-First Local Resume Builder',
    description: 'Create professional resumes locally in your browser. 100% private, works offline, no AI text generation.',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary',
    title: 'Vitaena - Privacy-First Local Resume Builder',
    description: 'Create professional resumes locally in your browser. 100% private, works offline, no AI text generation.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#61C0BE" />
      </head>
      <body className={`${roboto.variable} font-sans`}>
        <MUIThemeProvider>
          <PWAWrapper />
          {children}
        </MUIThemeProvider>
      </body>
    </html>
  );
}
