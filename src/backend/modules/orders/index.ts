import { OrdersRepository } from "./orders.repository";
import { OrdersService } from "./orders.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();

export const ordersRepository = new OrdersRepository(cacheService);
export const ordersService = new OrdersService(ordersRepository);

export * from "./orders.service";
export * from "./orders.repository";
export * from "./orders.actions";
