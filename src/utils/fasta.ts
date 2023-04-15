import { jbfilereader } from './filereader';

/**
 * read fasta file by line
 * @param file file to read
 */
export class Fasta {
  file: File;
  filereader: jbfilereader;
  gzipped: boolean;
  constructor(file: File) {
    this.file = file;
    this.gzipped = this.file.name.match(/(\.gz)$/) ? true : false;
    this.filereader = new jbfilereader(this.file, this.gzipped);
  }

  async *[Symbol.asyncIterator]() {
    let counter = 0;
    const rec: { [key: number]: string } = { 0: '', 1: '' };
    while (!this.filereader.eof) {
      const line = await new Promise<string>((resolve) =>
        this.filereader.readline((line: string) => resolve(line))
      );
      if (line != '\n') {
        if (counter < 1) {
          rec[counter] = line.trim();
          counter += 1;
        } else if (counter === 1) {
          rec[counter] = line.trim().toUpperCase();
          counter = 0;
          yield new Sequence(rec[0], rec[1]);
        }
      }
    }
  }
}

/**
 * read fastq file by line
 * @param file file to read
 * @param readingPgCallback optional callback function to show progress
 */
export class Fastq extends Fasta {
  readingPgCallback?: (p: number) => void;
  constructor(file: File, readingPgCallback?: (p: number) => void) {
    super(file);
    this.readingPgCallback = readingPgCallback;
  }

  async *[Symbol.asyncIterator]() {
    let counter = 0;
    const rec: { 0: string; 1: string; 2: string; 3: string } = {
      0: '',
      1: '',
      2: '',
      3: '',
    };
    let prepercent = 0;
    while (!this.filereader.eof) {
      const line = await new Promise<string>((resolve) =>
        this.filereader.readline((line: string) => resolve(line))
      );
      const percentage = this.filereader.fpos / this.file.size;
      if (line != '\n') {
        if (counter < 3) {
          rec[counter as 0 | 1 | 2 | 3] = line.trim();
          counter += 1;
        } else if (counter === 3) {
          rec[counter as 0 | 1 | 2 | 3] = line.trim();
          counter = 0;
          yield new Sequence(rec[0], rec[1], rec[3]);
        }
      }
      if (percentage !== prepercent && this.readingPgCallback) {
        this.readingPgCallback(percentage);
        prepercent = percentage;
      }
    }
  }
}

/**
 * unit of fastq or fasta files
 * @param header sequence name
 * @param sequence sequence
 * @param quality quality of sequence
 */
export class Sequence {
  header: string;
  seq: string;
  qual: string | undefined;
  type: string;
  seqArray: string[];
  constructor(header: string, sequence: string, quality?: string) {
    this.header = header.replace(/^@+|\n$|^>+/g, '');
    this.seq = sequence;
    this.seqArray = sequence.split('');
    this.qual = quality;
    if (quality) {
      this.type = 'fastq';
    } else {
      this.type = 'fasta';
    }
  }

  /**
   *
   * @returns sequence string
   */
  stringify() {
    if (this.type === 'fasta') {
      return `>${this.header}\n${this.seq}\n`;
    } else if (this.type === 'fastq') {
      return `@${this.header}\n${this.seq}\n+${this.header}\n${this.qual}`;
    }
  }

  length() {
    //sequence length
    return this.seq.length;
  }

  complement(a: string) {
    return (
      {
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
      } as { [key: string]: string }
    )[a];
  }

  revcomp() {
    //反向互补序列
    return this.seq.split('').reverse().map(this.complement).join('');
  }

  rqual() {
    //反向quality
    if (this.qual) {
      return this.qual.split('').reverse().join('');
    } else {
      return 'N';
    }
  }
}
