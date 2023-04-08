import { defineStore } from 'pinia';

const useReadsStore = defineStore('table', {
  state: () => ({
    reads: { '': 0 } as { [key: string]: number },
  }),
  actions: {
    addSeq(read: string) {
      this.reads[read] = (this.reads[read] || 0) + 1;
    },
    setSeq(reads: { [key: string]: number }) {
      this.reads = reads;
    },
  },
  getters: {
    count(state) {
      return Object.values(state.reads).reduce((a, b) => a + b, 0);
    },
  },
});

export { useReadsStore };
