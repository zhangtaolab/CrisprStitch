import { Sample, sampleAlign, multiAlign } from 'src/utils/alignment';
import { groupScratch } from 'src/utils/rendering';

self.onmessage = ({
  data: { type, samples },
}: {
  data: {
    type: string;
    samples: string;
  };
}) => {
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
      const multi_result = multiAlign(
        parsed_samples.map(
          (sample: {
            targetSeq: string;
            reads: {
              [key: string]: number;
            };
            name: string;
            gene: string;
            gRNA_PAM: string;
            barcode_L: string;
            barcode_R: string;
            group: string | undefined;
          }) => {
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
            return sampleAlign(
              { sample: sampleObj, haplotype: sample.reads },
              sample.targetSeq
            );
          }
        )
      );
      self.postMessage({
        type: 'all',
        result: { multi_result: multi_result },
      });
    }
  }
};
