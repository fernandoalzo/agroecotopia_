import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/ai/forecasting/demand.service.ts");

export interface DemandForecast {
  productId: string;
  predictedDemand: number;
  confidence: number;
  period: { start: Date; end: Date };
}

export class DemandForecastingService {
  async predictDemand(_productId: string): Promise<DemandForecast> {
    log.info("[Forecasting] predictDemand placeholder — implementar con ML cuando se active.");
    throw new Error("DemandForecastingService no implementado.");
  }

  async predictStoreDemand(_storeId: string): Promise<DemandForecast[]> {
    log.info("[Forecasting] predictStoreDemand placeholder.");
    return [];
  }
}
