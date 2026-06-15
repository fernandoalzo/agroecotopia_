import type { AIProvider } from "../providers/types";
import { AIFeature } from "../providers/types";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/vision/vision.service.ts");

export interface ImageAnalysisResult {
  labels: string[];
  category?: string;
  quality: "low" | "medium" | "high";
  containsText: boolean;
  extractedText?: string;
}

export interface VisualSearchResult {
  productId: string;
  score: number;
}

export class VisionService {
  constructor(private provider: AIProvider) {}

  async analyzeImage(_imageUrl: string): Promise<ImageAnalysisResult> {
    if (!this.provider.availableFeatures.includes(AIFeature.VISION)) {
      log.warn("[Vision] El proveedor activo no soporta visión por computadora.");
      throw new Error("Visión no disponible con el proveedor actual.");
    }

    log.info("[Vision] analyzeImage placeholder — implementar cuando se active.");
    return {
      labels: [],
      quality: "medium",
      containsText: false,
    };
  }

  async searchByImage(_imageUrl: string): Promise<VisualSearchResult[]> {
    log.info("[Vision] searchByImage placeholder.");
    return [];
  }

  async classifyImage(_imageUrl: string): Promise<string[]> {
    log.info("[Vision] classifyImage placeholder.");
    return [];
  }
}
