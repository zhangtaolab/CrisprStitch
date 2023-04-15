import { readsMaster } from 'src/utils/master';

function saveToLocalStorage(seq: string) {
  try {
    if (localStorage.has(seq)) {
      let stored = parseInt(localStorage.getItem(seq) as string);
      localStorage.set(seq, stored++);
    } else {
      localStorage.set(seq, 1);
    }
  } catch (e) {
    if (e instanceof DOMException) {
      console.log('localStorage is full');
      self.postMessage({ type: 'arrange', toStore: seq });
    }
  }
}

self.onmessage = ({
  data: { filea, fileb, barcodeLength },
}: {
  data: { filea: File; fileb: File | undefined; barcodeLength: number };
}) => {
  const master = new readsMaster(
    fileb ? [filea, fileb] : [filea],
    barcodeLength
  );
  master.saveAsSequence(saveToLocalStorage, (p: number) =>
    self.postMessage({ type: 'progress', progress: p })
  );
  self.postMessage({ type: 'arrange' });
};
