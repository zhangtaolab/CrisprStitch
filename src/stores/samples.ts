import { defineStore } from 'pinia';
import { Sample, SampleInfo } from './interface/sample';
import { Sequence } from 'src/utils/fasta';

function revcomp(seq: string) {
  return seq
    .split('')
    .reverse()
    .map(
      (b) =>
        ({
          A: 'T',
          T: 'A',
          G: 'C',
          C: 'G',
          R: 'Y',
          Y: 'R',
          a: 't',
          t: 'a',
          c: 'g',
          g: 'c',
          r: 'y',
          y: 'r',
        }[b])
    )
    .join('');
}

const useSampleInfoStore = defineStore('table', {
  state: () => ({
    sampleInfo: [] as SampleInfo[],
  }),
  actions: {
    addSample(sample: Sample) {
      this.sampleInfo.push({
        ...sample,
        targetSeq: '',
        reads: {} as SampleInfo['reads'],
      });
    },
    removeSample(sample: Sample) {
      try {
        const index = this.sampleInfo.indexOf(
          this.sampleInfo.filter((s) => s.name === sample.name)[0]
        );
        if (index > -1) {
          this.sampleInfo.splice(index, 1);
        }
      } catch (e) {
        console.error(e);
      }
    },
    targetSeq(seq: Sequence) {
      this.sampleInfo.forEach((sample) => {
        if (sample.name === seq.header) {
          sample.targetSeq = seq.seq;
        }
      });
    },
    arrangeReads(reads: { [key: string]: number }) {
      for (const read in reads) {
        for (let i = 0; i < this.sampleInfo.length; i++) {
          const sample = this.sampleInfo[i];
          const revcomp_barcode_R = revcomp(sample.barcode_R);
          const revcomp_barcode_L = revcomp(sample.barcode_L);
          const match =
            (read.startsWith(sample.barcode_L) &&
              read.endsWith(revcomp_barcode_R)) ||
            (read.startsWith(revcomp_barcode_L) &&
              read.endsWith(revcomp_barcode_R));
          const revmatch =
            (read.startsWith(sample.barcode_R) &&
              read.endsWith(revcomp_barcode_L)) ||
            (read.startsWith(revcomp_barcode_R) &&
              read.endsWith(revcomp_barcode_L));
          if (match) {
            sample.reads[read] = reads[read];
          } else if (revmatch) {
            sample.reads[revcomp(read)] = reads[read];
          }
        }
      }
    },
  },
  getters: {
    count(state) {
      return state.sampleInfo.length;
    },
    names: (state) => {
      return state.sampleInfo.map((s) => s.name);
    },
    groups(state) {
      return [...new Set(state.sampleInfo.map((s) => s.group))];
    },
    barcodeLength(state) {
      return state.sampleInfo[0].barcode_L.length;
    },
  },
});

export { useSampleInfoStore };
