export const StockKeys = {
  master: (productId: string) => `stock:master:${productId}`,
  lock: (productId: string) => `lock:stock:${productId}`,
  confirm: (pedidoId: string) => `lock:confirm:${pedidoId}`,
  allMasterPattern: `stock:master:*`,
  allLockPattern: `lock:stock:*`,
};
