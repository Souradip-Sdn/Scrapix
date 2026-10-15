import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Scrapix | Enterprise Scrap Network",
    template: "%s | Scrapix",
  },
  description:
    "A full-stack enterprise e-waste marketplace, collection and environmental impact platform.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Apply saved theme immediately (before paint) to avoid flash
                var saved = localStorage.getItem('scrapix_theme') || 'dark';
                document.documentElement.setAttribute('data-theme', saved);
                // Block transitions on first paint, then re-enable them
                document.documentElement.classList.add('no-theme-transition');
                requestAnimationFrame(function() {
                  requestAnimationFrame(function() {
                    document.documentElement.classList.remove('no-theme-transition');
                  });
                });
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <div className="mesh-bg" aria-hidden="true" />
          <SiteHeader />
          <main className="site-main">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
