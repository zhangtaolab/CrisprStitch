import { Notify } from 'quasar';
import { useReadsStore } from 'src/stores/reads';
import { useSampleInfoStore } from '../stores/sampleinfo';
import { stitch, countMerged } from './stitch';

class readsMaster {
  files: File[];
  gzipped: boolean;
  constructor(files: File[]) {
    this.files = files.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    this.gzipped = this.files[0].name.match(/(\.gz)$/) ? true : false;
  }

  async saveAsSequence(cb?: (p: number) => void) {
    const sampleinfo = useSampleInfoStore();
    if (sampleinfo.count > 20) {
      Notify.create({
        message:
          'Caution! More than 20 samples detected. Please consider split your samples.',
        color: 'accent',
        position: 'top',
      });
    }
    if (this.files.length > 1) {
      const merged = stitch(
        {
          filea: this.files[0],
          fileb: this.files[1],
          barcodeLength: sampleinfo.barcodeLength,
        },
        cb
      );
      merged.then(() => console.log(useReadsStore().$state));
    } else {
      const reads = countMerged(this.files[0], cb);
      reads.then(() => console.log(useReadsStore().$state));
    }
  }
}

export { readsMaster };
