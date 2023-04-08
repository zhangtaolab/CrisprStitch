import { jbfilereader } from './filereader';
import * as xlsx from 'xlsx';
import { Notify } from 'quasar';
// import { Sample } from '../store/interface'

/**
 * python zip function works only for arrays
 * @param rows [a, b, c] [d, e, f]
 * @returns [a, d], [b, e], [c, f]
 */
const zip = (...rows: any[][]) =>
  [...rows[0]].map((_, c) => rows.map((row) => row[c]));

/**
 * read information from tables
 */
class Table {
  file: File;
  format: string | undefined;
  filereader: jbfilereader;
  withHeader: boolean;
  delimiter: string | undefined;
  header: string[];
  table: { [key: string]: string }[] | undefined;
  sampletable: { [key: string]: { [key: string]: number } } | undefined;
  gene_sample_table:
    | {
        [key: string]: {
          [key: string]: { [key: string]: string | { [key: string]: number } };
        };
      }
    | undefined;
  validation: boolean;
  /**
   *
   * @param file table file
   * @param withHeader if table has header, default is true
   * @param header table header, default is ['Index', 'Sample', 'Barcode_L', 'Barcode_R']
   */
  constructor(
    file: File,
    withHeader = true,
    header = ['Index', 'Sample', 'Barcode_L', 'Barcode_R']
  ) {
    this.validation = true;
    if (file.name.match(/\.tsv$/) || file.name.match(/\.txt$/)) {
      this.format = 'tsv';
      this.delimiter = '\t';
    } else if (file.name.match(/\.csv$/)) {
      this.format = 'csv';
      this.delimiter = ',';
    } else if (file.name.match(/\.xlsx$/)) {
      this.format = 'xlsx';
    } else {
      Notify.create({
        message: 'Unsupported file format.',
        icon: 'announcement',
      });
      this.validation = false;
    }
    this.file = file;
    this.header = header;
    this.filereader = new jbfilereader(file, false);
    this.withHeader = withHeader;
  }

  async read(receiver: (table: { [key: string]: string }[]) => void) {
    if (this.validation) {
      if (this.withHeader) {
        await new Promise<void>((resolve) => {
          this.filereader.readline((res: any) => {
            this.header = res.split(this.delimiter);
            resolve();
          });
        });
      }

      if (this.delimiter) {
        this.table = await new Promise((resolve, reject) => {
          const table: { [key: string]: string }[] = [];
          try {
            const readLoop = async () => {
              await new Promise<void>((resolve) => {
                this.filereader.readline((res: any) => {
                  const record = res.split(this.delimiter);
                  if (record.length > 1) {
                    const line: { [key: string]: string } = {};
                    for (const [fieldname, field] of zip(this.header, record)) {
                      line[fieldname] = field;
                    }
                    if (Object.keys(line).length == this.header.length)
                      table.push(line);
                  }
                  resolve();
                });
              });
              if (!this.filereader.eof) {
                await readLoop();
              } else {
                resolve(table);
              }
            };
            readLoop();
          } catch {
            Notify.create({
              message: 'Error reading file.',
              icon: 'announcement',
            });
            reject();
          }
        });
        receiver(this.table ? this.table : []);
      } else {
        this.table = await this.readWorkbook(this.file);
        receiver(this.table ? this.table : []);
      }
    }
  }

  readWorkbook(file: File) {
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    return new Promise<{ [key: string]: string }[]>((resolve, reject) => {
      reader.onload = (e) => {
        if (e.target) {
          const data = e.target.result;
          try {
            const workbook = xlsx.read(data, { type: 'binary' });
            const sheetNames = workbook.SheetNames; // 工作表名称集合
            const worksheet = workbook.Sheets[sheetNames[0]]; // 只读取第一张sheet
            const targettable = xlsx.utils.sheet_to_json(worksheet) as {
              [key: string]: string;
            }[];
            resolve(targettable);
          } catch {
            Notify.create({
              message: 'Error reading file.',
              icon: 'announcement',
            });
            reject();
          }
        }
      };
    });
  }

  /**
   * read barcode table and save information in json style
   * @param contigs merged haplotype
   * @param thresholdp minimum percentage of haplotype count reserved
   * @param thresholdn minimum count of haplotype reserved
   * @returns {[key: string]: {[key: string]: number}}
   */
  splitByBarcode(
    contigs: { [key: string]: number },
    thresholdp = 0,
    thresholdn = 0
  ) {
    const res: any = {};
    for (const sample of this.table!) {
      const barcodelen = sample['Barcode_R'].length;
      res[sample['Sample']] = {};
      let sumup = 0;
      for (const read in contigs) {
        if (
          read.slice(0, barcodelen) == sample['Barcode_R'] &&
          read.slice(-barcodelen) == this.revcomp(sample['Barcode_L'])
        ) {
          res[sample['Sample']][this.revcomp(read)] = contigs[read];
          sumup += contigs[read];
        } else if (
          read.slice(0, barcodelen) == sample['Barcode_L'] &&
          read.slice(-barcodelen) == this.revcomp(sample['Barcode_R'])
        ) {
          res[sample['Sample']][read] = contigs[read];
          sumup += contigs[read];
        }
      }
      console.log('sumup:', sample['Sample'], sumup);
      for (const read in res[sample['Sample']]) {
        if (
          res[sample['Sample']][read] < sumup * thresholdp ||
          res[sample['Sample']][read] < thresholdn
        )
          delete res[sample['Sample']][read];
      }
    }
    this.sampletable = res;
    return res;
  }

  /**
   *
   * @param samplebybarcodes
   * @returns {[key: string]: {[key: string]: {[key: string]: string | {[key: string]: number}}}}
   */
  async splitByGene(samplebybarcodes: {
    [key: string]: { [key: string]: number };
  }) {
    const res: any = {};
    for (const sample of this.table!) {
      if (!(sample['gene_name'] in res)) res[sample['gene_name']] = {};
      for (const samplebb in samplebybarcodes) {
        if (sample['Sample'] == samplebb) {
          if (!(samplebb in res[sample['gene_name']]))
            res[sample['gene_name']][samplebb] = {};
          res[sample['gene_name']][samplebb]['seq'] =
            samplebybarcodes[samplebb];
          res[sample['gene_name']][samplebb]['gRNA_PAM'] =
            sample['gRNA_PAM'].toUpperCase();
          // res[sample['gene_name']][samplebb]['vector'] = sample['Vector']
          // res[sample['gene_name']][samplebb]['note'] = sample['Note']
        }
      }
    }
    this.gene_sample_table = res;
    return res;
  }

  revcomp(seq: string) {
    function complement(a: string) {
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
    return seq.split('').reverse().map(complement).join('');
  }
}

export { Table };
