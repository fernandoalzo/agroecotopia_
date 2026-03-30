export type Language = 'es' | 'en';

export interface Translations {
  navbar: {
    inicio: string;
    productos: string;
    nosotros: string;
    contacto: string;
    carrito: string;
    miCarrito: string;
    idioma: string;
    tema: string;
  };
  hero: {
    badge: string;
    title: string;
    titleAccent: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    imageAlt: string;
  };
  about: {
    badge: string;
    title: string;
    description1: string;
    description2: string;
    tagline: string;
    pillars: {
      organic: { title: string; desc: string };
      sustainable: { title: string; desc: string };
      healthy: { title: string; desc: string };
      direct: { title: string; desc: string };
      biodiversity: { title: string; desc: string };
      fairTrade: { title: string; desc: string };
    };
  };
  contact: {
    badge: string;
    title: string;
    description: string;
    address: string;
    form: {
      name: string;
      email: string;
      message: string;
      submit: string;
    };
  };
  products: {
    title: string;
    description: string;
    all: string;
    fertilizers: string;
    machinery: string;
    seeds: string;
    search: string;
    noResults: string;
    addToCart: string;
    viewDetails: string;
    outOfStock: string;
    viewAll: string;
    fullCatalog: string;
    ourHarvest: string;
    catalogDescription: string;
    searchPlaceholder: string;
    showingResults: string;
    taxesIncluded: string;
    available: string;
    added: string;
    noStock: string;
    addToOrder: string;
    productInfo: string;
    viewModes: {
      grid: string;
      compact: string;
      list: string;
    };
    quantity: string;
    items: {
      [slug: string]: {
        name: string;
        description: string;
        unit: string;
      };
    };
  };
  cart: {
    title: string;
    empty: string;
    emptyCartPrompt: string;
    total: string;
    checkout: string;
    remove: string;
    viewCart: string;
    viewProducts: string;
    orderSummary: string;
    subtotal: string;
    shipping: string;
    toCalculate: string;
    completeOrder: string;
    securePayment: string;
    keepShopping: string;
  };
  common: {
    loading: string;
    error: string;
    footerText: string;
    footerCatchphrase: string;
    copyright: string;
    whatsappMessage: string;
  };
}

export type TranslationKey = keyof Translations;
