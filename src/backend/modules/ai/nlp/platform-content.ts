import { config } from "@/config/config";

export interface PlatformDocument {
  id: string;
  title: string;
  content: string;
  category: string;
}

export const PLATFORM_DOCUMENTS: PlatformDocument[] = [
  {
    id: "platform-about",
    title: "Acerca de Agroecotopia",
    content: `${config.app.name} es una plataforma integral que conecta a campesinos, agrónomos, profesionales del agro, vendedores de productos y prestadores de servicios en un solo ecosistema digital. Ofrece un foro de discusión donde los actores del campo pueden interactuar sobre cultivos, plagas, técnicas y todo lo que abarca el agro colombiano. También brinda un espacio de comercio donde los usuarios pueden ofrecer y acceder a productos y servicios agropecuarios, así como contratar consultorías especializadas de forma virtual o presencial.`,
    category: "plataforma",
  },
  {
    id: "platform-mission",
    title: "Misión de Agroecotopia",
    content: "Democratizar el acceso a la información y las oportunidades para todos los actores del campo colombiano, derribando las barreras geográficas y tecnológicas.",
    category: "plataforma",
  },
  {
    id: "platform-forum",
    title: "Foro Colaborativo",
    content: `Espacio de diálogo donde campesinos, agrónomos y profesionales comparten conocimientos, resuelven dudas sobre cultivos y plagas, y construyen colectivamente el saber del campo colombiano. Las preguntas deben estar relacionadas con la agricultura. Antes de preguntar, verifica si tu pregunta ya fue respondida en discusiones previas.`,
    category: "foro",
  },
  {
    id: "forum-rules",
    title: "Reglas del Foro",
    content: config.forum.rules.join(". "),
    category: "foro",
  },
  {
    id: "forum-labels",
    title: "Etiquetas del Foro",
    content: `Las etiquetas disponibles en el foro son: cultivos (café, plátano, cacao, cítricos, frutales, hortalizas, cereales, leguminosas, ornamentales, cannabis), suelos (arcilloso, arenoso, franco, limoso, sustrato), clima (tropical, seco, templado, húmedo, frío), y temas (plagas, riego, nutrición, poda, cosecha).`,
    category: "foro",
  },
  {
    id: "platform-stores",
    title: "Tiendas y Productos",
    content: "Mercado digital que ofrece una amplia variedad de productos y servicios agropecuarios, permitiendo a los campesinos acceder a más opciones, mejores precios y proveedores confiables. Los vendedores pueden crear sus propias tiendas dentro de la plataforma.",
    category: "tiendas",
  },
  {
    id: "platform-consulting",
    title: "Consultorías Profesionales",
    content: "Profesionales del agro ofrecen asesoría especializada de forma virtual o presencial, brindando acompañamiento técnico para impulsar la productividad y sostenibilidad de los cultivos.",
    category: "servicios",
  },
  {
    id: "platform-community",
    title: "Comunidad Agroecológica",
    content: "Red colaborativa de agricultores, agrónomos, vendedores y profesionales que trabajan juntos para fortalecer el tejido social y económico del campo colombiano.",
    category: "comunidad",
  },
  {
    id: "contact-info",
    title: "Información de Contacto",
    content: `Dirección: San José Caldas - Barrio el Carmen - A un lado de la cooperativa de caficultores. Puedes contactarnos a través del formulario en la página de contacto o mediante el chat de soporte en la plataforma.`,
    category: "contacto",
  },
  {
    id: "platform-cart",
    title: "Carrito de Compras y Pedidos",
    content: "Los usuarios pueden agregar productos agroecológicos al carrito de compras. Al finalizar la compra, deben completar la información de envío y seleccionar un método de pago. Los métodos de pago disponibles incluyen: acordar con un asesor, criptomonedas (Bitcoin), Nequi, Mercado Pago, y PSE (débito bancario). El pedido pasa por varios estados: pendiente, confirmado, en preparación, en camino, en bodega, entregado, o cancelado.",
    category: "compras",
  },
  {
    id: "platform-shipping",
    title: "Envíos",
    content: "Los envíos se configuran por tienda. Cada tienda define sus zonas de envío, tarifas (fijas o por peso), y montos mínimos para envío gratis. Las ciudades de envío disponibles incluyen Medellín, Bogotá, Cali, Barranquilla, Cartagena, Bucaramanga, Pereira, Manizales, Armenia, Ibagué, Neiva, Pasto, Popayán, Villavicencio, Montería, Sincelejo, Valledupar, Santa Marta, Cúcuta, Tunja, y otras.",
    category: "compras",
  },
  {
    id: "platform-account",
    title: "Cuentas y Roles de Usuario",
    content: `Los usuarios pueden registrarse con correo electrónico o con Google. Hay tres roles en la plataforma: "user" (usuario regular que puede comprar y participar en el foro), "seller" (vendedor que puede crear y gestionar su propia tienda), y "admin" (administrador con acceso al panel de control). Los vendedores pueden gestionar hasta 5 tiendas, con un máximo de ${config.marketplace.maxProductsPerStore} productos por tienda.`,
    category: "cuenta",
  },
  {
    id: "platform-orders",
    title: "Estados de Pedido",
    content: "Los pedidos pasan por los siguientes estados: PENDIENTE (recién creado, pendiente de confirmación), CONFIRMADO (pedido confirmado, el stock se descuenta), EN_PREPARACION (el vendedor está preparando el pedido), EN_BODEGA (el pedido está listo en bodega), EN_CAMINO (el pedido está en ruta de entrega), ENTREGADO (entregado al cliente), CANCELADO (pedido cancelado).",
    category: "compras",
  },
  {
    id: "platform-notifications",
    title: "Notificaciones en la Plataforma",
    content: "Los usuarios reciben notificaciones sobre nuevos mensajes en el chat, respuestas en el foro, actualizaciones de estado de pedidos, y cambios en las tiendas. Las notificaciones se pueden ver en el campanario de la interfaz y se marcan como leídas al hacer clic.",
    category: "plataforma",
  },
];

export function searchPlatformDocuments(query: string): PlatformDocument[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return PLATFORM_DOCUMENTS
    .map(doc => {
      const searchText = `${doc.title} ${doc.content}`.toLowerCase();
      const matches = terms.filter(t => searchText.includes(t)).length;
      const score = matches / terms.length;
      return { doc, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(entry => entry.doc);
}
