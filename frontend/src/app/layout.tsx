import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Drishti AI — India's Climate Digital Twin",
  description: "A national-scale climate intelligence platform that creates a living digital twin of India's atmosphere, oceans, land systems, and weather patterns.",
  keywords: ["climate change", "weather forecasting", "digital twin", "disaster management", "agricultural advisory", "India weather"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${ibmPlexMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-space-blue-dark text-gray-100 selection:bg-electric-cyan/30 selection:text-electric-cyan">
        {children}
      </body>
    </html>
  );
}
