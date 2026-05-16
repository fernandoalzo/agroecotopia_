import { OrdersRepository } from "./orders.repository";
import { OrdersService } from "./orders.service";

export const ordersRepository = new OrdersRepository();
export const ordersService = new OrdersService(ordersRepository);

export * from "./orders.service";
export * from "./orders.repository";
export * from "./orders.actions";
