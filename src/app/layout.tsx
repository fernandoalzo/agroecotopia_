import type { Metadata, Viewport } from "next";
import { Providers } from "./Providers";
import "@/frontend/styles/globals.css";
import { config } from "@/config/config";

export const metadata: Metadata = {
  title: `${config.app.name} | Cosecha Sostenible`,
  description: "Productos agroecológicos cultivados con amor y respeto por la tierra.",
};

/** Keyboard overlays the page instead of resizing/pushing layout (mobile chat UX) */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "overlays-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
