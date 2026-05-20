import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

import { config } from "@/config/config";

export const metadata: Metadata = {
  title: `Nosotros | ${config.app.name}`,
  description: "Conoce nuestra historia, nuestra misión y los pilares que sustentan nuestra visión de un agro más justo y sostenible.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
