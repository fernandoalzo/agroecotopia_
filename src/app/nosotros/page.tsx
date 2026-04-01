import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "Nosotros | Agroecotopia",
  description: "Conoce nuestra historia, nuestra misión y los pilares que sustentan nuestra visión de un agro más justo y sostenible.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
