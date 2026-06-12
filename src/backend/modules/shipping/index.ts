import { ShippingRepository } from "./shipping.repository";
import { ShippingService } from "./shipping.service";

export const shippingRepository = new ShippingRepository();
export const shippingService = new ShippingService(shippingRepository);
