import { defineStore } from 'pinia';
import workerURL from 'src/worker/stitch.worker?worker';

const useWorkerStore = defineStore('worker', {
  state: () => ({
    worker: null as Worker | null,
  }),
  actions: {
    initWorker() {
      // const workerURL = new URL('../worker/stitch.worker.js', import.meta.url);
      // this.worker = new Worker(workerURL, { type: 'module' });
      this.worker = new workerURL();
    },
  },
});

export { useWorkerStore };
