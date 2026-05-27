import { StoreRepository } from "./store.repository";
import { StoreService } from "./store.service";

export const storeRepository = new StoreRepository();
export const storeService = new StoreService(storeRepository);
