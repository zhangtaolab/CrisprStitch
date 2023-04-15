import { defineStore } from 'pinia';

const useReadsStore = defineStore('reads', {
  state: () => ({
    reads: {} as { [key: string]: number },
    progress: 0,
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
  },
  getters: {
    sumUp(state) {
      return Object.values(state.reads).reduce((a, b) => a + b, 0);
    },
  },
});

export { useReadsStore };
