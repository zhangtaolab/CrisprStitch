interface Sample {
  name: string;
  gene: string;
  gRNA_PAM: string;
  barcode_L: string;
  barcode_R: string;
  group: string | undefined;
}

interface SampleInfo extends Sample {
  targetSeq: string;
  reads: {
    seq: string;
    count: number;
  }[];
}

export type { Sample, SampleInfo };
