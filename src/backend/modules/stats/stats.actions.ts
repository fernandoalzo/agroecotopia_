"use server";

import { statsService } from ".";
import logger from "@/utils/logger";

const log = logger.child();

export async function getHomeStatsAction() {
  try {
    const stats = await statsService.getHomeStats();
    return { success: true, stats };
  } catch (error) {
    log.error("Failed to get home stats:", error);
    return { success: false, stats: { users: 500, posts: 100, products: 15 } };
  }
}
