import { defineStore } from 'pinia';

const useWorkerStore = defineStore('worker', {
  state: () => ({
    worker: null as Worker | null,
  }),
  actions: {
    initWorker() {
      const workerURL = new URL('../worker/stitch.worker.ts', import.meta.url);
      this.worker = new Worker(workerURL, { type: 'module' });
    },
  },
});

export { useWorkerStore };
