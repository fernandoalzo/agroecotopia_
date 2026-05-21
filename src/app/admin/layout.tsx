import type { Viewport } from "next";
import { AdminInteractiveWidgetMeta } from "@/frontend/components/admin/AdminInteractiveWidgetMeta";

/** Admin-only: keyboard shrinks the viewport so chat inputs stay visible */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminInteractiveWidgetMeta />
      {children}
    </>
  );
}
