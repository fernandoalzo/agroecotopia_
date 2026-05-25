import { Metadata } from "next";
import ComunidadPageClient from "./ComunidadPageClient";
import { config } from "@/config/config";

export const metadata: Metadata = {
  title: `Comunidad | ${config.app.name}`,
  description: "Únete a nuestra vibrante comunidad agroecológica. Participa en foros, asiste a eventos y conecta con agricultores y compradores de todo el país.",
};

export default function ComunidadPage() {
  return <ComunidadPageClient />;
}
