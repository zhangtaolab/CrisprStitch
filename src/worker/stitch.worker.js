import { readsMaster } from 'src/utils/master';

self.onmessage = ({ data: { filea, fileb, barcodeLength } }) => {
  const master = new readsMaster(
    fileb ? [filea, fileb] : [filea],
    barcodeLength
  );
  try {
    const mergeResult = master.saveAsSequence(
      (seq) => {
        self.postMessage({ type: 'seq', result: seq });
      },
      (p) => self.postMessage({ type: 'progress', result: p })
    );
    if (mergeResult) {
      mergeResult.then((result) => {
        self.postMessage({
          type: 'mergeResult',
          result: result,
        });
      });
    }
  } catch (e) {
    self.postMessage({
      type: 'error',
      result: e.message,
    });
  }
};
