import { StoreRepository } from "./store.repository";
import { StoreService } from "./store.service";
import { StoreTaxRepository } from "./storeTax.repository";
import { StoreTaxService } from "./storeTax.service";

export const storeRepository = new StoreRepository();
export const storeService = new StoreService(storeRepository);

export const storeTaxRepository = new StoreTaxRepository();
export const storeTaxService = new StoreTaxService(storeTaxRepository);
