import { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contacto | Agroecotopia",
  description: "¿Tienes dudas? ¿Quieres ser parte de nuestra red? Escríbenos y nos pondremos en contacto contigo lo antes posible.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
