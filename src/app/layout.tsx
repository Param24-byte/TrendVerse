import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrendVerse — Real-Time Trend Intelligence for Developers",
  description:
    "Discover what developers are building right now. TrendVerse scrapes GitHub Trending, Hacker News, Product Hunt, and Hugging Face every 30 minutes to surface emerging tech trends, scored by velocity and clustered by topic.",
  keywords: ["trends", "developer tools", "github trending", "hacker news", "product hunt", "ai trends"],
  authors: [{ name: "TrendVerse" }],
  openGraph: {
    title: "TrendVerse — Real-Time Trend Intelligence",
    description: "Discover what developers are building right now.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-animated-gradient text-foreground antialiased">
        <TooltipProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0f1629",
                color: "#f8fafc",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "10px",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "#0f1629" },
              },
              error: {
                iconTheme: { primary: "#f43f5e", secondary: "#0f1629" },
              },
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
