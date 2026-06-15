const NAMESPACE = "cache";

function hash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    h = ((h << 5) - h) + c;
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export const CacheKeys = {
  product: {
    list: (skip: number, take: number, categories?: string[], storeId?: string) =>
      `${NAMESPACE}:product:list:${skip}:${take}:${categories ? hash(categories.join(",")) : ""}:${storeId || ""}`,

    total: (categories?: string[], storeId?: string) =>
      `${NAMESPACE}:product:total:${categories ? hash(categories.join(",")) : ""}:${storeId || ""}`,

    byId: (id: string) =>
      `${NAMESPACE}:product:id:${id}`,

    search: (query: string, skip: number, take: number, categories?: string[], storeId?: string) =>
      `${NAMESPACE}:product:search:${hash(query.toLowerCase())}:${skip}:${take}:${categories ? hash(categories.join(",")) : ""}:${storeId || ""}`,

    searchCount: (query: string, categories?: string[], storeId?: string) =>
      `${NAMESPACE}:product:search-count:${hash(query.toLowerCase())}:${categories ? hash(categories.join(",")) : ""}:${storeId || ""}`,

    byStore: (storeId: string, skip: number, take: number) =>
      `${NAMESPACE}:product:store:${storeId}:list:${skip}:${take}`,

    byStoreCount: (storeId: string) =>
      `${NAMESPACE}:product:store:${storeId}:total`,

    categories: `${NAMESPACE}:product:categories`,

    categoryCounts: (storeId?: string) =>
      `${NAMESPACE}:product:category-counts:${storeId || ""}`,

    allPattern: `${NAMESPACE}:product:*`,
  },

  order: {
    byId: (id: string) => `${NAMESPACE}:order:id:${id}`,

    byUsuarioId: (usuarioId: string) => `${NAMESPACE}:order:user:${usuarioId}`,

    all: `${NAMESPACE}:order:all`,

    paginated: (page: number, limit: number, estado?: string, search?: string, storeId?: string) =>
      `${NAMESPACE}:order:paginated:${page}:${limit}:${estado || ""}:${search ? hash(search.toLowerCase()) : ""}:${storeId || ""}`,

    statusCounts: (storeId?: string) => `${NAMESPACE}:order:status-counts:${storeId || ""}`,

    byStore: (storeId: string) => `${NAMESPACE}:order:store:${storeId}`,

    allPattern: `${NAMESPACE}:order:*`,
  },

  envio: {
    byId: (id: string) => `${NAMESPACE}:envio:id:${id}`,

    byPedidoId: (pedidoId: string) => `${NAMESPACE}:envio:pedido:${pedidoId}`,

    byStore: (storeId: string, page: number, limit: number, estado?: string, search?: string) =>
      `${NAMESPACE}:envio:store:${storeId}:${page}:${limit}:${estado || ""}:${search ? hash(search.toLowerCase()) : ""}`,

    allPaginated: (page: number, limit: number, estado?: string, search?: string) =>
      `${NAMESPACE}:envio:all:${page}:${limit}:${estado || ""}:${search ? hash(search.toLowerCase()) : ""}`,

    statusCounts: (storeId?: string) => `${NAMESPACE}:envio:status-counts:${storeId || ""}`,

    allPattern: `${NAMESPACE}:envio:*`,
  },

  forum: {
    posts: (filters: string, search: string, limit: number, cursor: string | undefined, sortBy: string) =>
      `${NAMESPACE}:forum:posts:${hash(filters)}:${hash(search)}:${limit}:${cursor ? hash(cursor) : "first"}:${sortBy}`,

    byId: (id: string) =>
      `${NAMESPACE}:forum:post:${id}`,

    answerById: (id: string) =>
      `${NAMESPACE}:forum:answer:${id}`,

    communityStats: `${NAMESPACE}:forum:community-stats`,

    topContributors: `${NAMESPACE}:forum:top-contributors`,

    trendingLabels: `${NAMESPACE}:forum:trending-labels`,

    allPattern: `${NAMESPACE}:forum:*`,
  },
};
