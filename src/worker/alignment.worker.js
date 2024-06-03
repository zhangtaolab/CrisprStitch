import { Sample, sampleAlign, multiAlign } from 'src/utils/alignment';
import { groupScratch } from 'src/utils/rendering';

self.onmessage = ({ data: { type, samples, threshold } }) => {
  switch (type) {
    case 'group': {
      const multi_result = JSON.parse(samples);
      const chart_data = groupScratch(multi_result);
      self.postMessage({
        type: 'group',
        result: { multi_result: multi_result, chart_data: chart_data },
      });
      break;
    }
    case 'all': {
      const parsed_samples = JSON.parse(samples);
      const sample_number = parsed_samples.length;
      const multi_result = multiAlign(
        parsed_samples.map((sample, index) => {
          const sampleObj = new Sample(
            sample.name,
            sample.gene,
            sample.gRNA_PAM.toUpperCase(),
            sample.barcode_L,
            sample.barcode_R,
            sample.group
          );
          sampleObj.sumUp(sample.reads);
          sampleObj.getRef(sample.targetSeq);
          const chopped_reads = sampleObj.chopOff(
            sample.reads,
            Number(threshold)
          );
          //todo: overchop warning
          if (Object.keys(chopped_reads).length === 0) {
            self.postMessage({
              type: 'error',
              result: {
                message: 'Overchop warning',
                origin: Object.keys(sample.reads).length,
                sample: sample.name,
              },
            });
          }
          return sampleAlign(
            { sample: sampleObj, haplotype: chopped_reads },
            sample.targetSeq,
            (p) =>
              self.postMessage({
                type: 'progress',
                result: {
                  progress: p / sample_number + index / sample_number,
                },
              })
          );
        })
      );
      self.postMessage({
        type: 'all',
        result: { multi_result: multi_result },
      });
    }
  }
};
