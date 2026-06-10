import { EventEmitter } from 'events';

// Singleton EventEmitter stored on globalThis to survive:
// 1. HMR (hot module replacement) in development
// 2. Next.js production bundling (Server Actions and server code in separate chunks)
// Without this, different chunks create independent EventEmitter instances
// and eventBus.emit() never reaches listeners registered in another chunk.
const globalEventBus = (globalThis as any).eventBus || new EventEmitter();
(globalThis as any).eventBus = globalEventBus;

globalEventBus.setMaxListeners(50);

export default globalEventBus as EventEmitter;
