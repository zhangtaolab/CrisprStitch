import { Fastq, Sequence } from './fasta';

/**
 * works same as python zip function
 * @param its [a, b, c], [d, e, f]
 * @returns [[a, d], [b, e], [c, f]]
 */
function* zip(...its: any) {
  function* iter(it: any) {
    yield* it;
  }
  its = its.map(iter);
  while (true) {
    const rs = its.map((it: any) => it.next());
    if (rs.some((r: any) => r.done)) return;
    yield rs.map((r: any) => r.value);
  }
}

/**
 * async python zip function
 * @param its [a, b, c], [d, e, f]
 * @returns [[a, d], [b, e], [c, f]]
 */
async function* azip(...its: any[]) {
  async function* iter(it: any) {
    for await (const x of it) yield x;
  }

  its = its.map(iter);

  while (true) {
    const rs = await Promise.all(its.map((it) => it.next()));
    if (rs.some((r) => r.done)) return;
    yield rs.map((r) => r.value);
  }
}
/**
 * simply read the merged file and count the haplotypes
 * @param file file to read
 * @param readingPgCallback show progress on page
 */
export async function countMerged(
  file: File,
  cb: (s: string) => void,
  readingPgCallback?: (p: number) => void
) {
  for await (const i of new Fastq(file, readingPgCallback)) {
    cb(i.seq);
  }
}

/**
 * merge pairs in 2 fastq files
 * @param  args files to merge
 * @param  readingPgCallback show progress on page
 */
export async function stitch(
  args: { filea: File; fileb: File; barcodeLength: number; pretty?: boolean },
  cb: (s: string) => void,
  readingPgCallback?: (p: number) => void
): Promise<void> {
  // counter
  let [numcontigs, numtotes] = [0, 0];
  const starttime: number = new Date().getTime();

  for await (const i of azip(
    new Fastq(args.filea, readingPgCallback),
    new Fastq(args.fileb)
  )) {
    const sewing = new Stitch(i[0], i[1], args.barcodeLength);
    numtotes += 1;
    if (sewing.record) {
      numcontigs += 1;
      if (args.pretty) {
        console.log(`>${sewing.reca.header} (${sewing.score})`);
        console.log(sewing.pretty);
      }
      cb(sewing.record.seq);
    }
  }
  const duration: number = new Date().getTime() - starttime;
  console.log(
    `Made ${numcontigs} contigs out of ${numtotes} read pairs in ${
      duration / 1000
    } seconds`
  );
}

/**
 * merge one pair of reads
 * receive result by calling record attribute
 */
class Stitch {
  reca: Sequence;
  recb: Sequence;
  record: Sequence | undefined;
  pretty: string;
  score: number;
  barcodeL: number;
  /**
   * Merge
   * @param reca one read from file1
   * @param recb one read from file2
   */
  constructor(reca: Sequence, recb: Sequence, barcodeLength: number) {
    this.reca = reca;
    this.recb = recb;
    this.barcodeL = barcodeLength;
    this.pretty = '';
    this.score = 0.0;
    this.find_overlaps();
  }

  /**
   *
   * @returns unmerged pairs
   */
  originals() {
    return [this.reca, this.recb];
  }

  find_overlaps(limit = 6) {
    const [a, b] = [this.reca.seq, this.recb.revcomp()];
    let ovlp_index = 0;
    let instance = 'not found';
    let newseq = '';
    let newqual: string | undefined = '';

    // find overlap
    for (let n = limit; n <= Math.min(a.length, b.length); n++) {
      const ta = a.slice(-n);
      const tb = b.slice(0, n);

      if (ta === tb) {
        ovlp_index = n;
        instance = 'tail';
      }
    }

    // check if they cross
    if (instance === 'not found') {
      for (
        let n = limit;
        n <= Math.min(a.length - this.barcodeL, b.length - this.barcodeL);
        n++
      ) {
        const ta = a.slice(this.barcodeL, n + this.barcodeL);
        const tb = b.slice(-n - this.barcodeL, -this.barcodeL);
        if (ta === tb) {
          ovlp_index = n;
          instance = 'cross';
        }
      }
    }

    // generate contig according to score

    // parta
    const parta = a;
    const qparta = this.reca.qual;

    // concatenate
    let partb, qpartb;
    if (instance === 'not found') {
      partb = '';
      qpartb = '';
    } else if (instance === 'tail') {
      partb = b.slice(ovlp_index - b.length); // -(b.length-ovlp_index)
      qpartb = this.recb.rqual().slice(ovlp_index - b.length);
      newseq = parta + partb;
      newqual = qparta + qpartb;
    } else {
      partb = b.slice(-this.barcodeL);
      qpartb = this.recb.rqual().slice(-this.barcodeL);
      newseq = parta.slice(0, ovlp_index + this.barcodeL) + partb;
      newqual = qparta?.slice(0, ovlp_index + this.barcodeL) + qpartb;
    }

    if (instance !== 'not found') {
      this.pretty = `1:${a + '-'.repeat(ovlp_index - 1)}\n2:${
        '-'.repeat(ovlp_index - 1) + b
      }\nC:${newseq}\n`;
      this.record = new Sequence('@' + this.reca.header, newseq, newqual);
    }
  }
}
