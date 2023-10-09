import { Gunzip } from 'fflate';

/**
 * read plain or gzipped file by line with pure javascript
 * @param file file to read
 * @param gzipped whether the file is gzipped
 */
export class UltimateFilereader {
  file: File;
  reader: ReadableStreamDefaultReader;
  buffer: string;
  eof: boolean;
  gzipped: boolean;
  filesize: number;
  fpos: number;
  lines: number;
  gzip: Gunzip;
  constructor(file: File, gzipped: boolean) {
    this.file = file;
    this.reader = file.stream().getReader();
    this.filesize = file.size;
    this.fpos = 0;
    this.buffer = '';
    this.eof = false;
    this.gzipped = gzipped;
    this.lines = 0;
    this.gzip = new Gunzip();
    return;
  }
  readline(callback: (line: string) => void) {
    const lfpos = this.buffer.indexOf('\n');
    if (lfpos === -1) {
      if (this.eof) {
        const result = this.buffer;
        this.buffer = '';
        callback(result);
      } else {
        this._getchunk().then(() => this.readline(callback));
      }
    } else {
      let result: string;
      if (this.buffer[lfpos - 1] === '\r') {
        result = this.buffer.slice(0, lfpos - 1);
      } else {
        result = this.buffer.slice(0, lfpos);
      }
      this.lines += 1;
      this.buffer = this.buffer.slice(lfpos + 1);
      callback(result);
    }
  }
  private async _getchunk() {
    const { done, value } = await this.reader.read();
    this.fpos += value?.length ?? 0;
    return new Promise<void>((resolve) => {
      if (done) {
        this.eof = true;
        resolve();
      }
      if (this.gzipped) {
        this.gzip.ondata = (data: Uint8Array) => {
          this.buffer += new TextDecoder().decode(data);
          resolve();
        };
        this.gzip.push(value);
      } else {
        this.buffer += new TextDecoder().decode(value);
        resolve();
      }
    });
  }
}
