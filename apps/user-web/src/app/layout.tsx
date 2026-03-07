import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const fontOutfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NexPrint | Zero-Wait Cloud Printing",
  description: "Experience the fastest way to print on-the-go. Premium cloud printing with express pickup at your nearest terminal.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
  themeColor: "#2563EB",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NexPrint",
  },
  openGraph: {
    title: 'NexPrint 2.0',
    description: 'Transform your document experience.',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                if (saved === 'dark') {
                  // User explicitly chose dark
                  document.documentElement.classList.add('dark');
                } else if (saved === 'light') {
                  // User explicitly chose light — always honour it
                  document.documentElement.classList.remove('dark');
                } else {
                  // No preference saved — follow OS
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                }
              } catch (_) {}

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered');
                  }, function(err) {
                    console.log('SW failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${fontOutfit.variable} ${fontInter.variable} antialiased bg-[var(--background)] selection:bg-blue-600/10`}
      >
        {children}
      </body>
    </html>
  );
}
