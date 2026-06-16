export interface SimilarEntityResult {
  entityId: string;
  similarity: number;
}

export interface EmbeddingStats {
  total: number;
  withEmbedding: number;
  pending: number;
  percentage: number;
}
