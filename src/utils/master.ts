import { stitch, countMerged } from './stitch';

class readsMaster {
  files: File[];
  gzipped: boolean;
  barcodeLength: number;
  constructor(files: File[], barcodeLength: number) {
    this.files = files.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    this.gzipped = this.files[0].name.match(/(\.gz)$/) ? true : false;
    this.barcodeLength = barcodeLength;
  }

  saveAsSequence(cb: (s: string) => void, pcb?: (p: number) => void) {
    if (this.files.length > 1) {
      return stitch(
        {
          filea: this.files[0],
          fileb: this.files[1],
          barcodeLength: this.barcodeLength,
        },
        cb,
        pcb
      );
    } else {
      countMerged(this.files[0], cb, pcb);
    }
  }
}

export { readsMaster };
