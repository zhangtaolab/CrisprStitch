/** Allows to read File or Blob objects in a synchronous way. */
interface FileReaderSync {
  readAsArrayBuffer(blob: Blob): ArrayBuffer;
  readAsBinaryString(blob: Blob): string;
  readAsDataURL(blob: Blob): string;
  readAsText(blob: Blob, encoding?: string): string;
}

declare const FileReaderSync: {
  prototype: FileReaderSync;
  new (): FileReaderSync;
};

declare module 'bioseq';

interface jbfilereader {
  _getchunk(): () => Promise<void>;
  readline(): (cb: (line: string) => void) => void;
}
