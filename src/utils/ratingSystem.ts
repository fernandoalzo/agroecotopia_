/**
 * Sistema de calificación y ponderación para posts / entidades.
 * 
 * Este módulo provee funciones para calcular promedios de calificaciones
 * de forma estándar y bayesiana (ideal para sistemas en producción).
 */

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface RatingResult {
  average: number;
  totalVotes: number;
  bayesianAverage?: number; // Calculado si se usa el método bayesiano
}

/**
 * Calcula el promedio estándar ponderado de un conjunto de calificaciones (1 a 5 estrellas).
 * 
 * @param distribution - Un objeto con la cantidad de votos para cada calificación (1 al 5)
 * @returns El promedio ponderado y el total de votos
 */
export function calculateStandardAverage(distribution: RatingDistribution): RatingResult {
  let totalVotes = 0;
  let totalScore = 0;

  for (let i = 1; i <= 5; i++) {
    const score = i as keyof RatingDistribution;
    const votes = distribution[score] || 0;
    
    totalVotes += votes;
    totalScore += votes * score;
  }

  const average = totalVotes === 0 ? 0 : Number((totalScore / totalVotes).toFixed(2));

  return { average, totalVotes };
}

/**
 * Calcula el promedio bayesiano de las calificaciones.
 * El promedio bayesiano es el estándar profesional para evitar que un post
 * con 1 voto de 5 estrellas esté por encima de uno con 100 votos y promedio de 4.8.
 * 
 * Fórmula: (WR) = (v ÷ (v+m)) × R + (m ÷ (v+m)) × C
 * Donde:
 * - R = Promedio estándar de calificación para el post
 * - v = Número de votos para el post
 * - m = Número mínimo de votos requeridos (ej. un umbral, por defecto 5)
 * - C = Promedio de calificaciones en todo el sitio/comunidad
 * 
 * @param distribution - Un objeto con la cantidad de votos para cada calificación
 * @param globalAverage - Promedio de calificación global del sistema (C)
 * @param minVotesThreshold - Votos mínimos para que se empiece a confiar en la calificación (m)
 * @returns El resultado incluyendo el promedio estándar y el bayesiano
 */
export function calculateBayesianAverage(
  distribution: RatingDistribution,
  globalAverage: number = 3.0,
  minVotesThreshold: number = 5
): RatingResult {
  const { average, totalVotes } = calculateStandardAverage(distribution);

  if (totalVotes === 0) {
    return { average: 0, totalVotes: 0, bayesianAverage: 0 };
  }

  // Si no hay suficientes votos para aplicar la fórmula de forma útil, el bayesiano se acentúa más hacia el global
  const bayesianAverage = 
    ((totalVotes / (totalVotes + minVotesThreshold)) * average) +
    ((minVotesThreshold / (totalVotes + minVotesThreshold)) * globalAverage);

  return {
    average,
    totalVotes,
    bayesianAverage: Number(bayesianAverage.toFixed(2))
  };
}
