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
    progress: 'not ready',
  }),
  actions: {
    addSample(sample: Sample) {
      if (sample.group === 'None') {
        sample.group = sample.name;
      }
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
        if (sample.gene === seq.header) {
          sample.targetSeq = seq.seq;
        }
      });
    },
    arrangeReads(reads: { [key: string]: number }, last = false) {
      for (const read in reads) {
        if (this.$state.progress !== 'success') this.status('pending');
        for (let i = 0; i < this.sampleInfo.length; i++) {
          const sample = this.sampleInfo[i];
          if (sample.barcode_L === 'None' || sample.barcode_R === 'None') {
            if (read in sample.reads) {
              sample.reads[read] += reads[read];
            } else {
              sample.reads[read] = reads[read];
            }
            continue;
          }
          const revcomp_barcode_R = revcomp(sample.barcode_R);
          const revcomp_barcode_L = revcomp(sample.barcode_L);
          const match =
            read.startsWith(sample.barcode_L) &&
            read.endsWith(revcomp_barcode_R);
          const revmatch =
            read.startsWith(sample.barcode_R) &&
            read.endsWith(revcomp_barcode_L);
          if (match) {
            if (read in sample.reads) {
              sample.reads[read] += reads[read];
            } else {
              sample.reads[read] = reads[read];
            }
          } else if (revmatch) {
            const rvcpread = revcomp(read);
            if (rvcpread in sample.reads) {
              sample.reads[rvcpread] += reads[read];
            } else {
              sample.reads[rvcpread] = reads[read];
            }
          }
        }
      }
      if (last) this.status('success');
    },
    checkSample() {
      this.sampleInfo.forEach((sample) => {
        if (sample.targetSeq === '') {
          throw new Error(
            `No target sequence found in provided file at sample ${sample.name}.`
          );
        }
        if (sample.barcode_L.length !== sample.barcode_R.length) {
          throw new Error(`Barcode length mismatch at sample ${sample.name}.`);
        }
        if (Object.keys(sample.reads).length === 0) {
          throw new Error(
            `No reads-barcode matching found at sample ${sample.name}.`
          );
        }
      });
    },
    status(status: string) {
      this.$state.progress = status;
    },
    chopOff(sumup: number, thresholdn = 15, thresholdp = 0.005) {
      this.sampleInfo.forEach((sample) => {
        for (const read in sample.reads) {
          if (
            sample.reads[read] < sumup * thresholdp ||
            sample.reads[read] < thresholdn
          ) {
            delete sample.reads[read];
          }
        }
      });
    }
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
    sumUp(state) {
      return state.sampleInfo.reduce(
        (acc, cur) =>
          acc + Object.values(cur.reads).reduce((m, val) => m + val, 0),
        0
      );
    },
  },
});

export { useSampleInfoStore };
