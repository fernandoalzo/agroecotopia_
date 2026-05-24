import { Viewport } from "next";

export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
