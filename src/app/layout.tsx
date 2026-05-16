import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "@/frontend/styles/globals.css";

export const metadata: Metadata = {
  title: "Agroecotopia | Cosecha Sostenible",
  description: "Productos agroecológicos cultivados con amor y respeto por la tierra.",
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
