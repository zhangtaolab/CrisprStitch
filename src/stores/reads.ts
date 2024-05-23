import { defineStore } from 'pinia';

const useReadsStore = defineStore('reads', {
  state: () => ({
    reads: {} as { [key: string]: number },
    progress: 0,
    lastprogress: 0,
    lastTime: 0,
    threshold: 0.005,
  }),
  actions: {
    addSeq(read: string) {
      this.reads[read] = (this.reads[read] || 0) + 1;
    },
    setSeq(reads: { [key: string]: number }) {
      this.reads = reads;
    },
    changeProgress(progress: number) {
      this.$state.progress = progress;
    },
    estimatedRemaining() {
      const now = Date.now();
      if (this.$state.lastTime === 0) {
        this.$state.lastTime = now;
        return -1;
      } else {
        const timeDiff = now - this.$state.lastTime;
        const progressDiff = this.$state.progress - this.$state.lastprogress;
        const remaining =
          (timeDiff / progressDiff) * (1 - this.$state.progress);
        return remaining;
      }
    },
    setThreshold(threshold: string) {
      const mapper: { [key: string]: number } = {
        None: 0,
        '0.1%': 0.001,
        '0.5%': 0.005,
        '1%': 0.01,
        '3%': 0.03,
        '5%': 0.05,
        '10%': 0.1,
        '15%': 0.15,
      };
      this.threshold = mapper[threshold] ? mapper[threshold] : 0;
    },
  },
  getters: {
    sumUp(state) {
      return Object.values(state.reads).reduce((a, b) => a + b, 0);
    },
  },
});

export { useReadsStore };
