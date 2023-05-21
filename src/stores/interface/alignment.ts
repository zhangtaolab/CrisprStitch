interface sample {
  barcode_L: string;
  barcode_R: string;
  gRNA_PAM: string;
  gene: string;
  group: string;
  name: string;
  ref: string;
  reverse: string;
  sumup: number;
}

interface haplotype {
  query: string;
  count: number;
  insertions: {
    index: number;
    sequence: string;
  }[];
}

interface multialign {
  sample: sample;
  res: haplotype[];
}

export type { multialign, haplotype };
