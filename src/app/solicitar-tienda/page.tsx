import { submitStoreRequestAction } from "@/backend/modules/store/store.actions";
import SolicitarTiendaPageClient from "./SolicitarTiendaPageClient";

export default function SolicitarTiendaPage() {
  return <SolicitarTiendaPageClient submitStoreRequest={submitStoreRequestAction} />;
}
