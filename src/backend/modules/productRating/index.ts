import { ProductRatingRepository } from "./productRating.repository";
import { ProductRatingService } from "./productRating.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();
export const productRatingRepository = new ProductRatingRepository(cacheService);
export const productRatingService = new ProductRatingService(productRatingRepository);
