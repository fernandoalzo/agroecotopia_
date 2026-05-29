import { EventEmitter } from 'events';

// Create a singleton instance of EventEmitter that survives HMR and multiple module imports
const globalEventBus = (globalThis as any).eventBus || new EventEmitter();

// In development, store it on the global object to prevent it from being recreated
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).eventBus = globalEventBus;
}

// Increase max listeners since we might have multiple Socket.IO handlers or listeners
globalEventBus.setMaxListeners(50);

export default globalEventBus as EventEmitter;
