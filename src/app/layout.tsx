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
      <body className="min-h-screen bg-animated-gradient text-foreground antialiased relative overflow-x-hidden">
        {/* Faint structure dot-grid background */}
        <div className="fixed inset-0 pointer-events-none z-[-2] opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:2rem_2rem]" />
        
        {/* Tactile noise overlay texture */}
        <div className="fixed inset-0 pointer-events-none z-[-2] opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        {/* Ambient Aurora Orbs */}
        <div className="orb-1 fixed pointer-events-none z-[-1] rounded-full filter blur-[120px] opacity-[0.14] bg-indigo-600 w-[550px] h-[550px]" style={{ top: "-10%", left: "-10%" }} />
        <div className="orb-2 fixed pointer-events-none z-[-1] rounded-full filter blur-[120px] opacity-[0.14] bg-cyan-600 w-[450px] h-[450px]" style={{ top: "40%", right: "-10%" }} />
        <div className="orb-3 fixed pointer-events-none z-[-1] rounded-full filter blur-[120px] opacity-[0.12] bg-violet-600 w-[400px] h-[400px]" style={{ bottom: "-10%", left: "30%" }} />

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
