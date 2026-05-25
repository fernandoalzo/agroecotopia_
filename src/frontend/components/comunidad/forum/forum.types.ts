export type Answer = {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  rating: number;     // Average 1–5
  ratingCount: number; // Total number of ratings
  isAccepted: boolean;
  timestamp: string;
};

export type Question = {
  id: string;
  title: string;
  body: string;
  author: string;
  cropType: string;
  plantType: string;
  soilType: string;
  rating: number;     // Average 1–5
  ratingCount: number; // Total number of ratings
  timestamp: string;
  answers: Answer[];
  isTrending?: boolean;
};

export const cropTypes = ["Todos", "Hortalizas", "Frutales", "Cereales", "Cultivos Perennes"];
export const soilTypes = ["Todos", "Arcilloso", "Arenoso", "Franco", "Limoso"];
export const trendingTags = ["#RoyaCafé", "#Sintropía", "#Compostaje", "#MercadosLocales", "#AbonoVerde"];

export const mockQuestions: Question[] = [
  {
    id: "q1",
    title: "¿Cómo tratar la roya en plantas de café en suelos arcillosos sin químicos?",
    body: "He notado manchas anaranjadas en el envés de las hojas de mis plantas de café. Mi terreno es principalmente arcilloso y retiene mucha humedad. ¿Qué fungicidas orgánicos o controles biológicos me recomiendan para combatir este problema antes de la próxima cosecha?",
    author: "Carlos P.",
    cropType: "Cultivos Perennes",
    plantType: "Café",
    soilType: "Arcilloso",
    rating: 4.8,
    ratingCount: 64,
    timestamp: "Hace 2 horas",
    isTrending: true,
    answers: [
      {
        id: "a1",
        author: "María G.",
        authorRole: "Ing. Agrónoma",
        content: "Para suelos arcillosos, el principal problema es el drenaje que favorece al hongo. Te recomiendo aplicar caldo bordelés (mezcla de sulfato de cobre y cal) que está permitido en agricultura orgánica. Además, mejora la aireación realizando podas sanitarias.",
        rating: 4.9,
        ratingCount: 87,
        isAccepted: true,
        timestamp: "Hace 1 hora"
      },
      {
        id: "a2",
        author: "Finca El Sol",
        authorRole: "Agricultor",
        content: "Nosotros usamos extracto de cola de caballo rociado cada 15 días como preventivo. Funciona de maravilla, sobre todo en climas muy húmedos.",
        rating: 4.2,
        ratingCount: 31,
        isAccepted: false,
        timestamp: "Hace 30 minutos"
      }
    ]
  },
  {
    id: "q2",
    title: "¿Recomendaciones de abono verde para preparar suelo arenoso para maíz?",
    body: "Tengo un terreno arenoso muy pobre en nutrientes y retención de agua. Quiero sembrar maíz la próxima temporada. ¿Qué leguminosa me recomiendan sembrar ahora como abono verde?",
    author: "Elena R.",
    cropType: "Cereales",
    plantType: "Maíz",
    soilType: "Arenoso",
    rating: 4.5,
    ratingCount: 22,
    timestamp: "Hace 5 horas",
    answers: [
      {
        id: "a3",
        author: "Roberto V.",
        authorRole: "Productor Orgánico",
        content: "El frijol mucuna o frijol terciopelo es excelente para suelos arenosos. Aporta muchísimo nitrógeno y genera una gran cantidad de biomasa que mejorará la retención de agua de tu suelo a largo plazo.",
        rating: 4.7,
        ratingCount: 45,
        isAccepted: false,
        timestamp: "Hace 2 horas"
      }
    ]
  },
  {
    id: "q3",
    title: "Problemas de pudrición apical en tomates (Suelo Franco)",
    body: "Mis tomates están desarrollando una mancha negra en la parte inferior. El riego es constante y el suelo es franco. ¿Será falta de calcio o un problema de asimilación por el riego?",
    author: "Andrés M.",
    cropType: "Hortalizas",
    plantType: "Tomate",
    soilType: "Franco",
    rating: 4.1,
    ratingCount: 18,
    timestamp: "Hace 1 día",
    answers: []
  },
  {
    id: "q4",
    title: "Diseño de bosque de alimentos en clima templado",
    body: "Estoy empezando a planificar mi finca de 2 hectáreas usando principios de agroforestería sintrópica. ¿Qué árboles pioneros recomiendan para generar sombra rápida en los primeros 3 años?",
    author: "Valeria C.",
    cropType: "Frutales",
    plantType: "Varios",
    soilType: "Limoso",
    rating: 4.9,
    ratingCount: 52,
    timestamp: "Hace 2 días",
    isTrending: true,
    answers: []
  }
];
