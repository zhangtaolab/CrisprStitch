// import pako from './pako.min.js'
import pako from 'pako';

class _inflater {
  inflater_pako: any;
  inflating_buffer: any;
  ended: boolean | undefined;
  strm: any;
  constructor() {
    const window_bits = 15;
    const enable_windows_gzip = 32;
    this.inflater_pako = new pako.Inflate({
      to: 'string',
      chunkSize: 16384,
      windowBits: window_bits | enable_windows_gzip,
    });
    this.inflating_buffer = '';
    this.inflater_pako.onData = (chunk: any) => {
      this.inflating_buffer += chunk;
    };
  }
  decompress(chunk: Uint8Array, islastchunk: boolean) {
    this.inflating_buffer = '';
    this.inflater_pako.push(chunk, islastchunk);
    this.ended = this.inflater_pako.ended;
    this.strm = this.inflater_pako.strm;
    return this.inflating_buffer;
  }
}

export class jbfilereadersync {
  file: File;
  gzipped: boolean;
  buffer: string;
  filesize: number;
  chunksize: number;
  reader: FileReaderSync;
  inflater: _inflater | undefined;
  islastchunk: boolean;
  fpos: number;
  endpos: number;
  eof: boolean;
  constructor(file: File, gzipped: boolean) {
    this.file = file;
    this.gzipped = gzipped;
    this.buffer = '';
    this.filesize = this.file.size;
    this.chunksize = 1024 * 512;
    this.reader = new FileReaderSync();
    if (this.gzipped) {
      this.inflater = new _inflater();
    }
    this.islastchunk = false;
    this.fpos = 0;
    this.endpos = 0;
    this.eof = false;
    return;
  }
  private _getchunk() {
    if (this.fpos + this.chunksize >= this.filesize) {
      this.endpos = this.filesize;
      this.islastchunk = true;
    } else {
      this.endpos = this.fpos + this.chunksize;
    }
    const blob = this.file.slice(this.fpos, this.endpos);
    this.fpos += this.endpos - this.fpos;
    let s;
    if (this.inflater) {
      const raw_array = new Uint8Array(this.reader.readAsArrayBuffer(blob));
      s = this.inflater.decompress(raw_array, this.islastchunk);
      if (s) {
        if (this.inflater.ended && !this.islastchunk) {
          const remaining_bytes = this.inflater.strm.avail_in;
          let rel_pos = 0;
          while (
            raw_array[raw_array.byteLength - remaining_bytes + rel_pos] === 0
          ) {
            rel_pos++;
          }
          this.fpos -= remaining_bytes - rel_pos;
          this.inflater = new _inflater();
        }
        // if (this.inflater.ended && (this.inflater.strm.avail_in || !this.islastchunk)) {
        //     const remaining_bytes = this.inflater.strm.avail_in;
        //     let rel_pos = 0;
        //     while (raw_array[raw_array.byteLength - remaining_bytes + rel_pos] === 0) {
        //         rel_pos++;
        //     }
        //     this.fpos -= remaining_bytes - rel_pos;
        //     this.inflater = new _inflater();
        // }
      } else {
        throw 'Something wrong with the gzipped file!';
      }
    } else {
      s = this.reader.readAsText(blob);
    }
    return s;
  }
  readline() {
    let lfpos, result;
    if (this.eof) {
      return '';
    }
    lfpos = this.buffer.indexOf('\n');
    while (lfpos === -1) {
      if (this.fpos >= this.filesize) {
        result = this.buffer;
        this.buffer = '';
        this.fpos = this.filesize;
        this.eof = true;
        return result;
      }
      this.buffer += this._getchunk();
      lfpos = this.buffer.indexOf('\n');
    }
    if (this.buffer[lfpos - 1] === '\r') {
      result = this.buffer.slice(0, lfpos - 1);
    } else {
      result = this.buffer.slice(0, lfpos);
    }
    this.buffer = this.buffer.slice(lfpos + 1);
    return result;
  }
  read4lines() {
    let lfpos, result;
    if (this.eof) {
      return '';
    }
    lfpos = this.buffer.indexOf('\n@');
    while (lfpos === -1) {
      if (this.fpos >= this.filesize) {
        result = this.buffer;
        this.buffer = '';
        this.fpos = this.filesize;
        this.eof = true;
        return result;
      }
      this.buffer += this._getchunk();
      lfpos = this.buffer.indexOf('\n@');
    }
    if (this.buffer[lfpos - 1] === '\r') {
      result = this.buffer.slice(0, lfpos - 1);
    } else {
      result = this.buffer.slice(0, lfpos);
    }
    this.buffer = this.buffer.slice(lfpos + 1);
    return result;
  }
}

export class jbfilereader {
  file: File;
  gzipped: boolean;
  buffer: string;
  filesize: number;
  reader: FileReader;
  chunksize: number;
  inflater: _inflater | undefined;
  islastchunk: boolean;
  fpos: number;
  endpos: number;
  eof: boolean;
  constructor(file: File, gzipped: boolean) {
    this.file = file;
    this.gzipped = gzipped;
    this.buffer = '';
    this.filesize = this.file.size;
    this.chunksize = 1024 * 512;
    this.reader = new FileReader();
    if (this.gzipped) {
      this.inflater = new _inflater();
    }
    this.islastchunk = false;
    this.fpos = 0;
    this.endpos = 0;
    this.eof = false;
    return;
  }
  private _readblob(blob: Blob) {
    const readpromise = new Promise((resolve, reject) => {
      this.reader.onload = (e: ProgressEvent<FileReader>) => {
        return resolve(e.target?.result);
      };
      this.reader.onerror = function () {
        return reject();
      };
    });
    if (this.gzipped) {
      this.reader.readAsArrayBuffer(blob);
    } else {
      this.reader.readAsText(blob);
    }
    return readpromise;
  }
  private _getchunk() {
    if (this.fpos + this.chunksize >= this.filesize) {
      this.endpos = this.filesize;
      this.islastchunk = true;
    } else {
      this.endpos = this.fpos + this.chunksize;
    }
    const blob = this.file.slice(this.fpos, this.endpos);
    const chunkpromise = new Promise<void>((resolve, reject) => {
      const readpromise = this._readblob(blob);
      return readpromise
        .then((s: any) => {
          this.fpos += this.endpos - this.fpos;
          if (this.inflater) {
            const raw_array = new Uint8Array(s);
            s = this.inflater.decompress(raw_array, this.islastchunk);
            if (s) {
              if (
                this.inflater.ended &&
                (this.inflater.strm.avail_in || !this.islastchunk)
              ) {
                const remaining_bytes = this.inflater.strm.avail_in;
                let rel_pos = 0;
                while (
                  raw_array[
                    raw_array.byteLength - remaining_bytes + rel_pos
                  ] === 0
                ) {
                  rel_pos++;
                }
                this.fpos -= remaining_bytes - rel_pos;
                this.inflater = new _inflater();
              }
            } else {
              window.alert('Something wrong with the gzipped file!');
              reject();
            }
          }
          this.buffer += s;
          resolve();
        })
        ['catch'](function (s) {
          window.alert('Something wrong while reading file!');
          reject();
        });
    });
    return chunkpromise;
  }
  readline(callback: any) {
    if (this.eof) {
      callback('');
    }
    const lfpos = this.buffer.indexOf('\n');
    if (lfpos === -1) {
      if (this.fpos >= this.filesize) {
        const result = this.buffer;
        this.buffer = '';
        this.eof = true;
        callback(result);
      } else {
        const datapromise = this._getchunk();
        datapromise.then(() => {
          return this.readline(callback);
        });
      }
    } else {
      let result: string;
      if (this.buffer[lfpos] === '\r') {
        result = this.buffer.slice(0, lfpos - 1);
      } else {
        result = this.buffer.slice(0, lfpos);
      }
      this.buffer = this.buffer.slice(lfpos + 1);
      callback(result);
    }
  }
  read4lines(callback: any) {
    if (this.eof) {
      callback('');
    }
    const lfpos = this.buffer.indexOf('\n@');
    if (lfpos === -1) {
      if (this.fpos >= this.filesize) {
        const result = this.buffer;
        this.buffer = '';
        this.eof = true;
        callback(result);
      } else {
        const datapromise = this._getchunk();
        datapromise.then(() => {
          return this.readline(callback);
        });
      }
    } else {
      let result: string;
      if (this.buffer[lfpos] === '\r@') {
        result = this.buffer.slice(0, lfpos - 1);
      } else {
        result = this.buffer.slice(0, lfpos);
      }
      this.buffer = this.buffer.slice(lfpos + 1);
      callback(result);
    }
  }
}
