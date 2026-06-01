import { StatsRepository } from "./stats.repository";

export class StatsService {
  constructor(private readonly statsRepository: StatsRepository) {}

  async getHomeStats() {
    return this.statsRepository.getHomeStats();
  }
}
