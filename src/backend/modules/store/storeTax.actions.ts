"use server";

import { storeTaxService } from "./index";
import { withStoreOwner } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";
import logger from "@/utils/logger";

const log = logger.child("src/backend/modules/store/storeTax.actions.ts");

export const createStoreTaxAction = async (storeId: string, data: { name: string; percentage: number; isActive?: boolean }) => {
  return withStoreOwner(storeId, async () => {
    log.info("Action: createStoreTaxAction", { storeId, data });
    const tax = await storeTaxService.createStoreTax(storeId, data);
    revalidatePath(`/mi-tienda`);
    return { success: true, data: tax };
  });
};

export const getStoreTaxesAction = async (storeId: string) => {
  return withStoreOwner(storeId, async () => {
    log.info("Action: getStoreTaxesAction", { storeId });
    const taxes = await storeTaxService.getTaxesByStoreId(storeId);
    return { success: true, data: taxes };
  });
};

export const updateStoreTaxAction = async (storeId: string, taxId: string, data: { name?: string; percentage?: number; isActive?: boolean }) => {
  return withStoreOwner(storeId, async () => {
    log.info("Action: updateStoreTaxAction", { storeId, taxId, data });
    const tax = await storeTaxService.updateStoreTax(taxId, storeId, data);
    revalidatePath(`/mi-tienda`);
    return { success: true, data: tax };
  });
};

export const deleteStoreTaxAction = async (storeId: string, taxId: string) => {
  return withStoreOwner(storeId, async () => {
    log.info("Action: deleteStoreTaxAction", { storeId, taxId });
    await storeTaxService.deleteStoreTax(taxId, storeId);
    revalidatePath(`/mi-tienda`);
    return { success: true };
  });
};
