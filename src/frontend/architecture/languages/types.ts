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
    pedidos: string;
    miCuenta: string;
    soporteChat: string;
    miPerfil: string;
    cerrarSesion: string;
    confirmarCerrarSesion: string;
    cancelar: string;
    salir: string;
    usuario: string;
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
  auth: {
    signIn: string;
    signInWith: string;
    signOut: string;
    myAccount: string;
    profile: string;
    welcome: string;
    email: string;
    password: string;
    name: string;
    loginPrompt: string;
    loginButton: string;
    googleButton: string;
    registerPrompt: string;
    registerButton: string;
    createAccount: string;
    alreadyHaveAccount: string;
    noAccount: string;
    invalidCredentials: string;
    registrationError: string;
    userExists: string;
  };
  checkout: {
    title: string;
    shippingInfo: string;
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    notes: string;
    notesPlaceholder: string;
    orderSummary: string;
    invoiceTitle: string;
    invoiceDate: string;
    invoiceNumber: string;
    billTo: string;
    confirmOrder: string;
    backToCart: string;
    processing: string;
    paymentMethod: string;
    paymentOptionAdvisor: string;
    paymentOptionNequi: string;
    paymentOptionMercadoPago: string;
    paymentOptionPSE: string;
    paymentOptionWompi: string;
    paymentMuteNote: string;
    advisorSuccessTitle: string;
    advisorSuccessMessage: string;
  };
}

export type TranslationKey = keyof Translations;
