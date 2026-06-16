import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const STORE_ID = 'cmq09sg5g000cdf23zwor0fo3';

interface SeedProduct {
  name: string;
  description: string;
  price: number;
  unidad: string;
  tag: string;
  emoji: string;
  peso: number;
  categories: string[];
}

const products: SeedProduct[] = [
  // ── Fertilizantes y Abonos ──
  { name: 'Abono Orgánico Compost 5kg', description: 'Abono orgánico compostado de alta calidad, ideal para huertos urbanos. Mejora la estructura del suelo y aporta nutrientes esenciales. Bolsa 5kg.', price: 15000, unidad: 'Unidad', tag: 'fertilizantes', emoji: '🪴', peso: 5, categories: ['Fertilizantes', 'Orgánico'] },
  { name: 'Humus de Lombriz 1kg', description: 'Humus de lombriz puro, enmienda orgánica rica en microorganismos benéficos. Mejora la fertilidad del suelo. Bolsa 1kg.', price: 8500, unidad: 'Unidad', tag: 'fertilizantes', emoji: '🪱', peso: 1, categories: ['Fertilizantes', 'Orgánico'] },
  { name: 'Fertilizante Líquido para Frutales', description: 'Fertilizante líquido concentrado para árboles frutales. Aporta nitrógeno, fósforo y potasio. Botella 1L.', price: 22000, unidad: 'Unidad', tag: 'fertilizantes', emoji: '🧪', peso: 1.1, categories: ['Fertilizantes'] },
  { name: 'Abono de Liberación Lenta 10kg', description: 'Fertilizante granulado de liberación lenta para cultivos extensivos. Nutrición balanceada por 3 meses. Bolsa 10kg.', price: 38000, unidad: 'Unidad', tag: 'fertilizantes', emoji: '🪨', peso: 10, categories: ['Fertilizantes'] },
  { name: 'Biol Abono Líquido Orgánico', description: 'Biol orgánico fermentado, activador de suelos y follaje. Estimula el crecimiento de cultivos. Botella 500ml.', price: 12000, unidad: 'Unidad', tag: 'fertilizantes', emoji: '🧪', peso: 0.5, categories: ['Fertilizantes', 'Orgánico'] },
  { name: 'Cal Agrícola 25kg', description: 'Cal agrícola dolomítica para corrección de pH del suelo. Mejora la disponibilidad de nutrientes. Bolsa 25kg.', price: 18000, unidad: 'Unidad', tag: 'fertilizantes', emoji: '⚪', peso: 25, categories: ['Fertilizantes'] },
  { name: 'Superfosfato Triple 20kg', description: 'Fertilizante granulado rico en fósforo para estimular la floración y el enraizamiento. Bolsa 20kg.', price: 45000, unidad: 'Unidad', tag: 'fertilizantes', emoji: '🪨', peso: 20, categories: ['Fertilizantes'] },
  { name: 'Urea Agrícola 25kg', description: 'Fertilizante nitrogenado de alta concentración (46% N) ideal para cultivos de hoja. Bolsa 25kg.', price: 52000, unidad: 'Unidad', tag: 'fertilizantes', emoji: '⬜', peso: 25, categories: ['Fertilizantes'] },
  { name: 'Abono Orgánico Bocashi 5kg', description: 'Bocashi preparado con microorganismos eficientes, ideal para cultivos orgánicos. Bolsa 5kg.', price: 16000, unidad: 'Unidad', tag: 'fertilizantes', emoji: '🪴', peso: 5, categories: ['Fertilizantes', 'Orgánico'] },
  { name: 'Fertilizante Foliar para Hortalizas', description: 'Fertilizante foliar líquido para hortalizas de hoja verde. Aplicación directa al follaje. Botella 500ml.', price: 14500, unidad: 'Unidad', tag: 'fertilizantes', emoji: '🧪', peso: 0.5, categories: ['Fertilizantes'] },

  // ── Plaguicidas y Fungicidas ──
  { name: 'Fungicida Orgánico de Cobre', description: 'Fungicida orgánico a base de sulfato de cobre para control de hongos. Apto para cultivos orgánicos. Botella 250ml.', price: 18000, unidad: 'Unidad', tag: 'plaguicidas', emoji: '🧴', peso: 0.3, categories: ['Plaguicidas', 'Orgánico'] },
  { name: 'Insecticida Natural de Neem', description: 'Insecticida orgánico a base de aceite de neem. Controla plagas sin dañar abejas ni benéficos. Botella 500ml.', price: 22000, unidad: 'Unidad', tag: 'plaguicidas', emoji: '🧴', peso: 0.5, categories: ['Plaguicidas', 'Orgánico'] },
  { name: 'Insecticida Biológico Bacillus', description: 'Insecticida biológico con Bacillus thuringiensis para control de orugas. 100% natural. Frasco 200g.', price: 25000, unidad: 'Unidad', tag: 'plaguicidas', emoji: '🧪', peso: 0.2, categories: ['Plaguicidas', 'Orgánico'] },
  { name: 'Herbicida Selectivo Pasto', description: 'Herbicida selectivo para control de malezas de hoja ancha sin dañar pastos. Botella 1L.', price: 32000, unidad: 'Unidad', tag: 'plaguicidas', emoji: '🧴', peso: 1.1, categories: ['Plaguicidas'] },
  { name: 'Fungicida Azufre Micronizado', description: 'Fungicida-enmienda a base de azufre micronizado para prevención de hongos. Bolsa 500g.', price: 12000, unidad: 'Unidad', tag: 'plaguicidas', emoji: '🟡', peso: 0.5, categories: ['Plaguicidas'] },
  { name: 'Trampa Pegajosa Amarilla', description: 'Trampa cromática amarilla adhesiva para monitoreo de moscas blancas y áfidos. 20 unidades.', price: 8500, unidad: 'Unidad', tag: 'plaguicidas', emoji: '🟨', peso: 0.2, categories: ['Plaguicidas'] },
  { name: 'Control Biológico Crisopa', description: 'Huevos de crisopa (1,000 unidades) para control biológico de pulgones y trips. Liberación manual.', price: 35000, unidad: 'Unidad', tag: 'plaguicidas', emoji: '🦟', peso: 0.05, categories: ['Plaguicidas', 'Orgánico'] },
  { name: 'Aceite Mineral Dormante', description: 'Aceite mineral para control de huevos de insectos en frutales. Aplicación en invierno. Botella 1L.', price: 18000, unidad: 'Unidad', tag: 'plaguicidas', emoji: '🧴', peso: 1, categories: ['Plaguicidas'] },
  { name: 'Molusquicida Granulado', description: 'Cebo granulado para control de babosas y caracoles en huertos. Bolsa 500g.', price: 9500, unidad: 'Unidad', tag: 'plaguicidas', emoji: '🧫', peso: 0.5, categories: ['Plaguicidas'] },
  { name: 'Repelente Natural de Aves', description: 'Repelente orgánico en gel para proteger frutales de aves. No tóxico. Frasco 250ml.', price: 14000, unidad: 'Unidad', tag: 'plaguicidas', emoji: '🧴', peso: 0.3, categories: ['Plaguicidas', 'Orgánico'] },

  // ── Semillas ──
  { name: 'Semillas de Tomate Orgánico', description: 'Semillas de tomate orgánico certificado, variedad chonto. Alto rendimiento. 100 semillas.', price: 5500, unidad: 'Unidad', tag: 'semillas', emoji: '🌱', peso: 0.01, categories: ['Semillas', 'Orgánico'] },
  { name: 'Semillas de Lechuga Crespa', description: 'Semillas de lechuga crespa verde premium. Germinación garantizada. 500 semillas.', price: 4500, unidad: 'Unidad', tag: 'semillas', emoji: '🌱', peso: 0.01, categories: ['Semillas'] },
  { name: 'Semillas de Zanahoria Orgánica', description: 'Semillas de zanahoria orgánica variedad Chantenay. Dulce y tierna. 200 semillas.', price: 4800, unidad: 'Unidad', tag: 'semillas', emoji: '🥕', peso: 0.01, categories: ['Semillas', 'Orgánico'] },
  { name: 'Semillas de Cilantro Cimarrón', description: 'Semillas de cilantro de hoja ancha. Resistente a altas temperaturas. 100 g.', price: 3200, unidad: 'Unidad', tag: 'semillas', emoji: '🌿', peso: 0.1, categories: ['Semillas'] },
  { name: 'Semillas de Frijol Orgánico', description: 'Semillas de frijol orgánico variedad cargamanto. Cosecha en 90 días. 250g.', price: 6800, unidad: 'Unidad', tag: 'semillas', emoji: '🫘', peso: 0.25, categories: ['Semillas', 'Orgánico'] },
  { name: 'Semillas de Maíz Dulce', description: 'Semillas de maíz dulce híbrido open-pollinated. Mazorcas dulces y jugosas. 100g.', price: 7500, unidad: 'Unidad', tag: 'semillas', emoji: '🌽', peso: 0.1, categories: ['Semillas'] },
  { name: 'Semillas de Calabacín Orgánico', description: 'Semillas de calabacín verde orgánico. Planta vigorosa y productiva. 20 semillas.', price: 5800, unidad: 'Unidad', tag: 'semillas', emoji: '🥒', peso: 0.01, categories: ['Semillas', 'Orgánico'] },
  { name: 'Kit Semillas Huerto 10 Variedades', description: 'Kit con 10 variedades de semillas de hortalizas para huerto casero. Incluye guía.', price: 28000, unidad: 'Unidad', tag: 'semillas', emoji: '🎁', peso: 0.15, categories: ['Semillas', 'Huerto'] },
  { name: 'Semillas de Pasto Ryegrass', description: 'Semillas de pasto ryegrass perenne para potreros y jardines. Bolsa 1kg.', price: 12000, unidad: 'Unidad', tag: 'semillas', emoji: '🌾', peso: 1, categories: ['Semillas'] },
  { name: 'Semillas de Girasol Orgánico', description: 'Semillas de girasol orgánico variedad enano. Flores comestibles y decorativas. 50 semillas.', price: 4200, unidad: 'Unidad', tag: 'semillas', emoji: '🌻', peso: 0.01, categories: ['Semillas', 'Orgánico'] },

  // ── Herramientas Manuales ──
  { name: 'Pala Cuadrada Acero', description: 'Pala cuadrada de acero templado con mango de madera. Ideal para excavación y movimiento de tierra.', price: 35000, unidad: 'Unidad', tag: 'herramientas', emoji: '🫴', peso: 2, categories: ['Herramientas'] },
  { name: 'Azadón Forjado', description: 'Azadón de acero forjado con filo templado. Mango de madera de 120cm. Para labranza manual.', price: 28000, unidad: 'Unidad', tag: 'herramientas', emoji: '⛏️', peso: 1.8, categories: ['Herramientas'] },
  { name: 'Rastrillo de Jardín 12 Dientes', description: 'Rastrillo de jardín con 12 dientes de acero templado. Mango ergonómico. Ancho 40cm.', price: 22000, unidad: 'Unidad', tag: 'herramientas', emoji: '🪛', peso: 1.2, categories: ['Herramientas'] },
  { name: 'Tijeras de Podar Profesional', description: 'Tijeras de podar bypass con hoja de acero SK5 y mango antideslizante. Corte preciso.', price: 32000, unidad: 'Unidad', tag: 'herramientas', emoji: '✂️', peso: 0.3, categories: ['Herramientas'] },
  { name: 'Carretilla de Jardín 70L', description: 'Carretilla de jardín con capacidad de 70 litros. Rueda neumática y estructura reforzada.', price: 85000, unidad: 'Unidad', tag: 'herramientas', emoji: '🛞', peso: 12, categories: ['Herramientas'] },
  { name: 'Regadera Galvanizada 10L', description: 'Regadera de acero galvanizado con roseta removible. Capacidad 10 litros.', price: 25000, unidad: 'Unidad', tag: 'herramientas', emoji: '🚿', peso: 0.8, categories: ['Herramientas'] },
  { name: 'Machete Acero Templado 22"', description: 'Machete de acero templado con mango de cumarú. Longitud 22 pulgadas. Incluye funda.', price: 28000, unidad: 'Unidad', tag: 'herramientas', emoji: '🔪', peso: 0.7, categories: ['Herramientas'] },
  { name: 'Cuchilla de Injertar', description: 'Navaja de injertar con hoja de acero inoxidable. Incluye separador de cortezas.', price: 18000, unidad: 'Unidad', tag: 'herramientas', emoji: '🔪', peso: 0.1, categories: ['Herramientas'] },
  { name: 'Cavador Manual de Jardín', description: 'Cavador manual tipo transplante con hoja de acero inoxidable. Mango ergonómico.', price: 15000, unidad: 'Unidad', tag: 'herramientas', emoji: '🫴', peso: 0.4, categories: ['Herramientas'] },
  { name: 'Guantes de Jardinería Látex', description: 'Guantes de jardinería con refuerzo de látex antideslizante. Protección completa. Talla M/L.', price: 12000, unidad: 'Unidad', tag: 'herramientas', emoji: '🧤', peso: 0.15, categories: ['Herramientas', 'Protección'] },

  // ── Sistemas de Riego ──
  { name: 'Manguera de Riego 1/2" x 50m', description: 'Manguera de PVC reforzada para riego. Diámetro 1/2 pulgada, 50 metros de largo.', price: 35000, unidad: 'Unidad', tag: 'riego', emoji: '🧵', peso: 3, categories: ['Riego'] },
  { name: 'Cinta de Riego por Goteo 100m', description: 'Cinta de riego por goteo de 16mm, espesor 8mil. Goteros cada 20cm. Rollo 100m.', price: 45000, unidad: 'Unidad', tag: 'riego', emoji: '📯', peso: 2, categories: ['Riego'] },
  { name: 'Aspersor de Impacto Bronce', description: 'Aspersor de impacto en bronce para riego de jardines y cultivos. Alcance 8-15m.', price: 22000, unidad: 'Unidad', tag: 'riego', emoji: '💦', peso: 0.4, categories: ['Riego'] },
  { name: 'Kit Riego por Goteo 50 Plantas', description: 'Kit completo de riego por goteo para 50 plantas. Incluye tubería, goteros y conectores.', price: 55000, unidad: 'Unidad', tag: 'riego', emoji: '💧', peso: 1.5, categories: ['Riego'] },
  { name: 'Válvula de Riego Automática', description: 'Válvula solenoide de 1 pulgada para automatización de riego. 24V AC. Conexión roscada.', price: 35000, unidad: 'Unidad', tag: 'riego', emoji: '⚙️', peso: 0.3, categories: ['Riego'] },
  { name: 'Microaspersor Jardín 360°', description: 'Microaspersor de 360° para invernadero y jardín. Caudal regulable. Paquete 10 unidades.', price: 15000, unidad: 'Unidad', tag: 'riego', emoji: '💦', peso: 0.15, categories: ['Riego'] },
  { name: 'Controlador de Riego Digital', description: 'Controlador de riego digital programable con sensor de lluvia. 4 zonas independientes.', price: 85000, unidad: 'Unidad', tag: 'riego', emoji: '📱', peso: 0.4, categories: ['Riego'] },
  { name: 'Filtro de Agua para Riego 3/4"', description: 'Filtro de malla inoxidable 120 mesh para sistema de riego. Conexión 3/4 pulgada.', price: 12000, unidad: 'Unidad', tag: 'riego', emoji: '🚰', peso: 0.3, categories: ['Riego'] },

  // ── Cercas y Vallados ──
  { name: 'Poste Metálico para Cerca 1.8m', description: 'Poste metálico galvanizado para cercas y tutores. Altura 1.8m. Incluye tapón. 10 unidades.', price: 45000, unidad: 'Unidad', tag: 'cercas', emoji: '📏', peso: 15, categories: ['Cercas'] },
  { name: 'Malla Eslabonada 2m x 10m', description: 'Malla eslabonada galvanizada para cerramiento. Alto 2m, largo 10m. Calibre 12.', price: 120000, unidad: 'Unidad', tag: 'cercas', emoji: '🔗', peso: 20, categories: ['Cercas'] },
  { name: 'Alambre de Púas 250m', description: 'Alambre de púas galvanizado para cercas de potreros. Rollo de 250 metros. Calibre 14.', price: 55000, unidad: 'Unidad', tag: 'cercas', emoji: '⚡', peso: 8, categories: ['Cercas'] },
  { name: 'Malla Plástica para Invernadero', description: 'Malla plástica antiáfidos para invernadero. Protege cultivos de plagas. 2m x 50m.', price: 65000, unidad: 'Unidad', tag: 'cercas', emoji: '🕸️', peso: 3, categories: ['Cercas', 'Invernadero'] },
  { name: 'Tutor Metálico Espiral Tomate', description: 'Tutor metálico en espiral para tomate y pepino. Acero recubierto. 1.5m. 10 unidades.', price: 18000, unidad: 'Unidad', tag: 'cercas', emoji: '🌀', peso: 1, categories: ['Cercas'] },
  { name: 'Cerca Eléctrica Portátil Kit', description: 'Kit de cerca eléctrica portátil para pastoreo rotativo. Incluye energizador solar y 100m.', price: 185000, unidad: 'Unidad', tag: 'cercas', emoji: '⚡', peso: 5, categories: ['Cercas'] },

  // ── Equipo de Protección ──
  { name: 'Overol de Trabajo Agrícola', description: 'Overol de algodón resistente con múltiples bolsillos. Ideal para labores de campo. Tallas M-XXL.', price: 45000, unidad: 'Unidad', tag: 'proteccion', emoji: '👕', peso: 0.6, categories: ['Protección'] },
  { name: 'Botas de Caucho para Campo', description: 'Botas de caucho natural con suela antideslizante. Caña alta. Protección completa. Tallas 38-44.', price: 55000, unidad: 'Unidad', tag: 'proteccion', emoji: '🥾', peso: 1.2, categories: ['Protección'] },
  { name: 'Gafas de Seguridad Agrícola', description: 'Gafas de seguridad antiempañante con protección UV. Ideales para fumigación y poda.', price: 12000, unidad: 'Unidad', tag: 'proteccion', emoji: '🥽', peso: 0.1, categories: ['Protección'] },
  { name: 'Respirador para Fumigación', description: 'Respirador media cara con filtros para vapores orgánicos. Cartuchos reemplazables.', price: 38000, unidad: 'Unidad', tag: 'proteccion', emoji: '😷', peso: 0.3, categories: ['Protección'] },
  { name: 'Guantes de Nitrilo Agrícolas', description: 'Guantes de nitrilo resistentes a agroquímicos. Reutilizables. Paquete 5 pares. Talla L.', price: 15000, unidad: 'Unidad', tag: 'proteccion', emoji: '🧤', peso: 0.2, categories: ['Protección'] },
  { name: 'Sombrero Agroecológico Alón Ancho', description: 'Sombrero de paja con alón ancho para protección solar en campo. Talla única ajustable.', price: 18000, unidad: 'Unidad', tag: 'proteccion', emoji: '👒', peso: 0.2, categories: ['Protección'] },

  // ── Maquinaria Pequeña ──
  { name: 'Motosierra Eléctrica 2000W', description: 'Motosierra eléctrica de 2000W con espada de 16 pulgadas. Frenado de emergencia.', price: 250000, unidad: 'Unidad', tag: 'maquinaria', emoji: '🪚', peso: 5.5, categories: ['Maquinaria'] },
  { name: 'Guadañadora Eléctrica 1500W', description: 'Guadañadora eléctrica 1500W para corte de pasto y maleza. Cabezal semiautomático.', price: 180000, unidad: 'Unidad', tag: 'maquinaria', emoji: '🌿', peso: 4.5, categories: ['Maquinaria'] },
  { name: 'Bomba de Agua Sumergible 2HP', description: 'Bomba sumergible para pozos con 2HP de potencia. Caudal 180L/min. Cable 20m.', price: 320000, unidad: 'Unidad', tag: 'maquinaria', emoji: '🔄', peso: 12, categories: ['Maquinaria'] },
  { name: 'Fumigadora de Mochila 20L', description: 'Fumigadora de mochila con bomba de presión de 20 litros. Boquilla ajustable.', price: 45000, unidad: 'Unidad', tag: 'maquinaria', emoji: '🎒', peso: 2, categories: ['Maquinaria'] },
  { name: 'Astilladora de Leña Manual', description: 'Astilladora de leña hidráulica manual con capacidad de 10 toneladas. Ideal para leña.', price: 180000, unidad: 'Unidad', tag: 'maquinaria', emoji: '🪓', peso: 25, categories: ['Maquinaria'] },
  { name: 'Biotrituradora Eléctrica 2500W', description: 'Biotrituradora eléctrica para ramas hasta 40mm de diámetro. Reducción silenciosa.', price: 380000, unidad: 'Unidad', tag: 'maquinaria', emoji: '⚙️', peso: 18, categories: ['Maquinaria'] },
  { name: 'Tractor de Jardín Eléctrico', description: 'Tractor de jardín eléctrico con batería de litio. Ancho de corte 80cm. Autonomía 2h.', price: 2500000, unidad: 'Unidad', tag: 'maquinaria', emoji: '🚜', peso: 120, categories: ['Maquinaria'] },
  { name: 'Motobomba Gasolina 6.5HP', description: 'Motobomba a gasolina de 6.5HP para riego y trasvase. Caudal 500L/min. Puerto 3".', price: 450000, unidad: 'Unidad', tag: 'maquinaria', emoji: '🔄', peso: 28, categories: ['Maquinaria'] },

  // ── Sanidad Animal ──
  { name: 'Desparasitante Bovino Oral', description: 'Desparasitante oral para bovinos de amplio espectro. Controla nematodos y tremátodos. Frasco 500ml.', price: 35000, unidad: 'Unidad', tag: 'sanidad-animal', emoji: '💊', peso: 0.5, categories: ['Sanidad Animal'] },
  { name: 'Vitaminas para Aves de Corral', description: 'Suplemento vitamínico hidrosoluble para aves. Aumenta producción de huevos. Bolsa 250g.', price: 18000, unidad: 'Unidad', tag: 'sanidad-animal', emoji: '💊', peso: 0.25, categories: ['Sanidad Animal'] },
  { name: 'Antibiótico para Cerdos Inyectable', description: 'Antibiótico de amplio espectro inyectable para porcinos. Tratamiento de infecciones. Frasco 100ml.', price: 28000, unidad: 'Unidad', tag: 'sanidad-animal', emoji: '💉', peso: 0.15, categories: ['Sanidad Animal'] },
  { name: 'Venda Veterinaria Cohesiva', description: 'Venda veterinaria auto-adhesiva para heridas y vendajes. 10cm x 4m. Paquete 6 unidades.', price: 12000, unidad: 'Unidad', tag: 'sanidad-animal', emoji: '🩹', peso: 0.2, categories: ['Sanidad Animal'] },
  { name: 'Vermífugo Equino Pasta', description: 'Vermífugo en pasta para equinos de amplio espectro. Sabor a manzana. Jeringa dosificadora.', price: 22000, unidad: 'Unidad', tag: 'sanidad-animal', emoji: '💊', peso: 0.1, categories: ['Sanidad Animal'] },
  { name: 'Curabicheros para Ovinos', description: 'Curabicheros spray para ovinos y caprinos. Previene miasis. Botella 500ml.', price: 15000, unidad: 'Unidad', tag: 'sanidad-animal', emoji: '🧴', peso: 0.5, categories: ['Sanidad Animal'] },
  { name: 'Electrolitos para Animales', description: 'Suplemento electrolítico en polvo para animales en etapa de recuperación. Bolsa 1kg.', price: 14000, unidad: 'Unidad', tag: 'sanidad-animal', emoji: '🧂', peso: 1, categories: ['Sanidad Animal'] },
  { name: 'Kit de Baño para Garrapatas', description: 'Shampoo garrapaticida para ganado. Control eficaz de garrapatas y piojos. Botella 1L.', price: 25000, unidad: 'Unidad', tag: 'sanidad-animal', emoji: '🧴', peso: 1.1, categories: ['Sanidad Animal'] },

  // ── Insumos de Invernadero ──
  { name: 'Plástico para Invernadero 200 micras', description: 'Plástico térmico para invernadero de 200 micras de espesor. Tratado UV. 8m x 50m.', price: 280000, unidad: 'Unidad', tag: 'invernadero', emoji: '📜', peso: 25, categories: ['Invernadero'] },
  { name: 'Malla Sombra 80% 4m x 10m', description: 'Malla de sombreo al 80% para invernaderos y viveros. Protege cultivos del sol intenso.', price: 45000, unidad: 'Unidad', tag: 'invernadero', emoji: '🕸️', peso: 3, categories: ['Invernadero'] },
  { name: 'Bandeja Germinadora 128 Celdas', description: 'Bandeja de germinación con 128 celdas de 3cm. Polipropileno reutilizable. Medidas 54x28cm.', price: 8500, unidad: 'Unidad', tag: 'invernadero', emoji: '📦', peso: 0.2, categories: ['Invernadero'] },
  { name: 'Mesa de Cultivo Metálica 1.2m', description: 'Mesa de cultivo metálica galvanizada con bandeja. Medidas 1.2m x 0.6m. Altura 0.8m.', price: 65000, unidad: 'Unidad', tag: 'invernadero', emoji: '🪑', peso: 6, categories: ['Invernadero'] },
  { name: 'Termómetro Higrómetro Digital', description: 'Termómetro e higrómetro digital para invernadero. Pantalla LCD con máximos y mínimos.', price: 15000, unidad: 'Unidad', tag: 'invernadero', emoji: '🌡️', peso: 0.1, categories: ['Invernadero'] },
  { name: 'Ventilador Extractor para Invernadero', description: 'Ventilador extractor axial de 30cm para circulación de aire en invernadero. 120V.', price: 75000, unidad: 'Unidad', tag: 'invernadero', emoji: '🌀', peso: 3, categories: ['Invernadero'] },
  { name: 'Maceta Biodegradable 10cm', description: 'Maceta biodegradable de fibra de coco comprimida. Se planta directamente al suelo. Paquete 50 unidades.', price: 12000, unidad: 'Unidad', tag: 'invernadero', emoji: '🪴', peso: 1, categories: ['Invernadero', 'Orgánico'] },
  { name: 'Sustrato para Germinación 10L', description: 'Sustrato ligero especial para germinación de semillas. Turba y perlita. Bolsa 10 litros.', price: 15000, unidad: 'Unidad', tag: 'invernadero', emoji: '🪨', peso: 3, categories: ['Invernadero'] },
  { name: 'Velo Térmico para Heladas', description: 'Velo térmico antiheladas para proteger cultivos. Tela no tejida transpirable. 2m x 20m.', price: 35000, unidad: 'Unidad', tag: 'invernadero', emoji: '🧣', peso: 2, categories: ['Invernadero'] },
  { name: 'Kit de Riego Automático Invernadero', description: 'Kit completo de nebulización para invernadero. Incluye bomba, tubos y nebulizadores.', price: 95000, unidad: 'Unidad', tag: 'invernadero', emoji: '💧', peso: 2, categories: ['Invernadero', 'Riego'] },

  // ── Sustratos y Mejoradores ──
  { name: 'Turba Rubia 20L', description: 'Turba rubia de sphagnum para jardinería y viveros. Retención de humedad. Bolsa 20L.', price: 22000, unidad: 'Unidad', tag: 'sustratos', emoji: '🪨', peso: 5, categories: ['Sustratos'] },
  { name: 'Fibra de Coco 5kg', description: 'Sustrato de fibra de coco expandida para cultivo en maceta. pH neutro. Bolsa 5kg.', price: 14000, unidad: 'Unidad', tag: 'sustratos', emoji: '🥥', peso: 5, categories: ['Sustratos', 'Orgánico'] },
  { name: 'Perlita Agrícola 10L', description: 'Perlita expandida para mejorar drenaje y aireación del sustrato. Bolsa 10L.', price: 8500, unidad: 'Unidad', tag: 'sustratos', emoji: '🪨', peso: 1.5, categories: ['Sustratos'] },
  { name: 'Vermiculita 5L', description: 'Vermiculita expandida para retención de humedad y germinación. Bolsa 5L.', price: 8000, unidad: 'Unidad', tag: 'sustratos', emoji: '🪨', peso: 1, categories: ['Sustratos'] },
  { name: 'Tierra Negra Abonada 25L', description: 'Tierra negra abonada lista para usar. Mezcla con compost y arena. Bolsa 25L.', price: 18000, unidad: 'Unidad', tag: 'sustratos', emoji: '🟫', peso: 12, categories: ['Sustratos'] },
  { name: 'Compost Orgánico 20L', description: 'Compost orgánico maduro de residuos vegetales. Rico en materia orgánica. Bolsa 20L.', price: 15000, unidad: 'Unidad', tag: 'sustratos', emoji: '🪴', peso: 8, categories: ['Sustratos', 'Orgánico'] },

  // ── Accesorios Varios ──
  { name: 'Etiquetas para Plantas 100uds', description: 'Etiquetas de PVC blanco para identificación de plantas y cultivos. Lápiz incluido. 100 unidades.', price: 5000, unidad: 'Unidad', tag: 'accesorios', emoji: '🏷️', peso: 0.1, categories: ['Accesorios'] },
  { name: 'Tijeras de Cosecha Acero Inox', description: 'Tijeras de cosecha con hoja de acero inoxidable y mango ergonómico. Corte suave.', price: 14000, unidad: 'Unidad', tag: 'accesorios', emoji: '✂️', peso: 0.15, categories: ['Accesorios'] },
  { name: 'Cinta Métrica para Campo 50m', description: 'Cinta métrica de fibra de vidrio para medición de terrenos. 50 metros. Estuche incluido.', price: 18000, unidad: 'Unidad', tag: 'accesorios', emoji: '📏', peso: 0.3, categories: ['Accesorios'] },
  { name: 'Cuchillo Multiusos Campo', description: 'Navaja multiusos con 12 herramientas para labores de campo. Acero inoxidable.', price: 25000, unidad: 'Unidad', tag: 'accesorios', emoji: '🔪', peso: 0.2, categories: ['Accesorios'] },
  { name: 'Linterna Recargable LED', description: 'Linterna LED recargable tipo frontal para trabajo nocturno. 200 lúmenes. Batería incluida.', price: 22000, unidad: 'Unidad', tag: 'accesorios', emoji: '🔦', peso: 0.15, categories: ['Accesorios'] },
  { name: 'Balanza Digital para Cosecha 50kg', description: 'Balanza digital con capacidad de 50kg y precisión de 10g. Pantalla LCD y gancho.', price: 35000, unidad: 'Unidad', tag: 'accesorios', emoji: '⚖️', peso: 1.5, categories: ['Accesorios'] },
  { name: 'Cubo Galvanizado 12L', description: 'Cubo de acero galvanizado con asa reforzada. Capacidad 12 litros. Ideal para campo.', price: 15000, unidad: 'Unidad', tag: 'accesorios', emoji: '🪣', peso: 0.6, categories: ['Accesorios'] },
  { name: 'Cordel Agrícola de Fique 200m', description: 'Cordel de fique natural para atado y tutorado de cultivos. Biodegradable. Rollo 200m.', price: 8000, unidad: 'Unidad', tag: 'accesorios', emoji: '🧵', peso: 0.5, categories: ['Accesorios', 'Orgánico'] },
  { name: 'Estacas para Tutores 50uds', description: 'Estacas de madera para tutorado de plantas. 80cm de largo. Tratadas. 50 unidades.', price: 15000, unidad: 'Unidad', tag: 'accesorios', emoji: '📏', peso: 3, categories: ['Accesorios'] },
  { name: 'KIT Guardián Suelo pH y Humedad', description: 'Medidor digital de pH, humedad y luz para suelo. Ideal para monitoreo de cultivos.', price: 28000, unidad: 'Unidad', tag: 'accesorios', emoji: '📟', peso: 0.2, categories: ['Accesorios'] },
];

async function main() {
  console.log(`Creando ${products.length} productos de agro-insumos...\n`);
  let created = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          unidad: p.unidad,
          tag: p.tag,
          emoji: p.emoji,
          images: [],
          stock: Math.floor(Math.random() * 200) + 10,
          peso: p.peso,
          dimensiones: null,
          envioGratis: false,
          storeId: STORE_ID,
          categories: {
            connectOrCreate: p.categories.map((c: string) => ({
              where: { name: c },
              create: { name: c },
            })),
          },
        },
      });
      created++;
      process.stdout.write(`  ✓ ${String(i + 1).padStart(2, '0')}/${products.length} ${p.name}\n`);
    } catch (e: any) {
      errors++;
      process.stdout.write(`  ✗ ${String(i + 1).padStart(2, '0')}/${products.length} ${p.name}: ${e.message}\n`);
    }
  }

  const total = await prisma.product.count({ where: { storeId: STORE_ID } });
  console.log(`\nResultado:`);
  console.log(`  Creados: ${created}`);
  console.log(`  Errores: ${errors}`);
  console.log(`  Total en tienda: ${total}`);
  await prisma.$disconnect();
}

main().catch(console.error);
