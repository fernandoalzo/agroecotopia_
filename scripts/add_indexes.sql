-- ============================================================
-- Índices compuestos para optimizar queries lentas
-- Ejecutar via: psql "$DIRECT_URL" -f scripts/add_indexes.sql
-- ============================================================

CREATE INDEX IF NOT EXISTS "Product_storeId_createdAt_idx"
  ON "Product" ("storeId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "DetallePedido_storeId_pedidoId_idx"
  ON "DetallePedido" ("storeId", "pedidoId");

CREATE INDEX IF NOT EXISTS "Conversation_type_storeId_sellerId_idx"
  ON "Conversation" ("type", "storeId", "sellerId");
