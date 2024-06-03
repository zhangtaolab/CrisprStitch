import bioseq from 'bioseq';
import { multialign, haplotype } from 'src/stores/interface';

class Sample {
  name: string;
  gene: string;
  gRNA_PAM: string;
  barcode_L: string;
  barcode_R: string;
  group: string;
  sumup: number | undefined;
  ref: string | undefined;
  reverse: boolean | undefined;
  identification: string | undefined;
  constructor(
    sample = '',
    gene = '',
    gRNA_PAM = '',
    barcode_L = '',
    barcode_R = '',
    group = '',
    identification?: string
  ) {
    this.name = sample;
    this.gene = gene;
    // this.vector = vector
    // this.note = note
    this.gRNA_PAM = gRNA_PAM;
    this.barcode_L = barcode_L;
    this.barcode_R = barcode_R;
    this.group = group;
    if (identification) this.identification = identification;
  }

  /**
   * get sum of haplotype reads count
   * @param haplotypes splited haplotypes of sample
   */
  sumUp(haplotypes: { [key: string]: number }) {
    let sum = 0;
    for (const haplotype in haplotypes) {
      sum += haplotypes[haplotype];
    }
    this.sumup = sum;
  }

  /**
   * get reference sequence at gRNA of sample
   * @param geneseq complete gene sequence
   * @param gRNA_PAM gRNA sequence
   */
  getRef(geneseq: string) {
    let ref = geneseq.toUpperCase();
    if (ref.indexOf(this.gRNA_PAM) == -1) {
      ref = revcomp(geneseq);
      this.reverse = true;
    }
    // try {
    //   const gRNA_PAM_pos = ref.indexOf(this.gRNA_PAM);
    //   this.ref = ref.slice(
    //     gRNA_PAM_pos > 70 ? gRNA_PAM_pos - 70 : 0,
    //     gRNA_PAM_pos + 70 + this.gRNA_PAM.length
    //   );
    //   this.reverse = rev;
    // } catch (error) {
    //   console.error(error); //todo: notify error report
    // }
    this.ref = geneseq;
  }

  chopOff(
    haplotype: { [key: string]: number },
    thresholdp = 0.005,
    thresholdn = 0
  ) {
    const haplotype_keys = Object.keys(haplotype);
    const haplotype_filtered: { [key: string]: number } = {};
    if (this.sumup) {
      for (const key of haplotype_keys) {
        if (
          haplotype[key] > thresholdn &&
          haplotype[key] / this.sumup > thresholdp
        ) {
          haplotype_filtered[key] = haplotype[key];
        }
      }
    }
    return haplotype_filtered;
  }
}

/**
 * align haplotypes in sample
 * @param hap_by_sample
 * @param gene_file
 * @returns {sample: sampleinfo, haplotype: alignment result[]}
 */
function sampleAlign(
  hap_by_sample: { sample: Sample; haplotype: { [key: string]: number } },
  targetSeq: string,
  progressCallback?: (p: number) => void
) {
  const res = {
    sample: hap_by_sample.sample,
    haplotype: [] as { result: any; count: number }[],
  };
  hap_by_sample.sample.getRef(targetSeq);
  //progress
  if (progressCallback) progressCallback(0);
  let progress = 0;
  for (const raw_query in hap_by_sample.haplotype) {
    const query = hap_by_sample.sample.reverse ? revcomp(raw_query) : raw_query;
    const rst = bioseq.align(hap_by_sample.sample.ref, query, false);
    res.haplotype.push({
      result: bioseq.cigar2gaps(
        hap_by_sample.sample.ref,
        query,
        rst.position,
        rst.CIGAR
      ),
      count: hap_by_sample.haplotype[raw_query],
    });
    progress += 1 / Object.keys(hap_by_sample.haplotype).length;
    if (progressCallback) progressCallback(progress);
  }
  return res;
}

function revcomp(seq: string) {
  return seq
    .split('')
    .reverse()
    .map(
      (a) =>
      ((
        {
          A: 'T',
          T: 'A',
          G: 'C',
          C: 'G',
          a: 't',
          t: 'a',
          c: 'g',
          g: 'c',
        } as { [key: string]: string }
      )[a])
    )
    .join('');
}

function getIndices(searchRegExp: RegExp, str: string) {
  const indices = [];
  let match;
  while ((match = searchRegExp.exec(str)) !== null) {
    let length_sum = 0;
    for (const indice of indices) {
      length_sum += indice.length;
    }
    indices.push({ index: match.index - length_sum, length: match[0].length });
  }
  return indices;
}

class AlignedPair {
  reference: string;
  query: string;
  gRNA_PAM: string;
  clean_reference: string;
  gRNA_PAM_pos: number;
  windowSize: number;
  constructor(
    reference: string,
    query: string,
    gRNA_PAM: string,
    windowSize = 30
  ) {
    this.reference = reference;
    this.query = query;
    this.gRNA_PAM = gRNA_PAM;
    this.windowSize = windowSize;
    this.clean_reference = this.reference.replace(
      /(A|T|C|G|a|t|c|g)-+(?=(A|T|C|G|a|t|c|g))/g,
      '$1'
    );
    this.gRNA_PAM_pos = this.clean_reference.indexOf(this.gRNA_PAM);
  }

  multi_result(): {
    query: string;
    insertions: { index: number; sequence: string }[];
  } {
    const result: {
      query: string;
      insertions: { index: number; sequence: string }[];
    } = { query: '', insertions: [] };
    result.query = this.remove_insertion().slice(
      this.gRNA_PAM_pos - this.windowSize,
      this.gRNA_PAM_pos + this.gRNA_PAM.length + this.windowSize
    );
    const insertions = this.get_insertion();
    let i = 0;
    while (i < insertions.length) {
      insertions[i].index -= this.gRNA_PAM_pos - this.windowSize;
      // console.log(`${insertions[i].index} > ${this.gRNA_PAM.length+100} is ${insertions[i].index > this.gRNA_PAM.length + 100}`)
      if (
        insertions[i].index < 0 ||
        insertions[i].index > this.gRNA_PAM.length + 100
      ) {
        insertions.splice(i, 1);
      } else {
        i++;
      }
    }
    result.insertions = insertions;
    return result;
  }

  remove_insertion(): string {
    const indices = getIndices(
      /(A|T|C|G|a|t|c|g)-+(?=(A|T|C|G|a|t|c|g))/g,
      this.reference
    );
    const new_indices = this.lookbehindAdjust(indices);
    const arrayQuery = this.query.split('');
    for (const insertion of new_indices) {
      arrayQuery.splice(insertion.index, insertion.length);
    }
    return arrayQuery.join('');
  }

  get_insertion(): { index: number; sequence: string }[] {
    const indices = getIndices(
      /(A|T|C|G|a|t|c|g)-+(?=(A|T|C|G|a|t|c|g))/g,
      this.reference
    );
    const new_indices = this.lookbehindAdjust(indices);
    const arrayQuery = this.query.split('');
    const insertions: { index: number; sequence: string }[] = [];
    for (const insertion of new_indices) {
      const insert = arrayQuery.splice(insertion.index, insertion.length);
      insertions.push({ index: insertion.index, sequence: insert.join('') });
    }
    return insertions;
  }

  lookbehindAdjust(
    indices: { index: number; length: number }[]
  ): { index: number; length: number }[] {
    for (const indice of indices) {
      indice.index += 1;
      indice.length -= 1;
    }
    return indices;
  }
}

function multiAlign(
  groupres: { sample: Sample; haplotype: { result: any; count: number }[] }[],
  windowSize = 30
): {
  sample: Sample;
  res: {
    query: string;
    count: number;
    insertions: { index: number; sequence: string }[];
  }[];
}[] {
  const resultset: {
    sample: Sample;
    res: {
      query: string;
      count: number;
      insertions: { index: number; sequence: string }[];
    }[];
  }[] = [];
  for (const sample of groupres) {
    // init
    let ref = sample.sample.ref as string;
    const result: {
      sample: Sample;
      res: {
        query: string;
        count: number;
        insertions: { index: number; sequence: string }[];
      }[];
    } = { sample: sample.sample, res: [] };
    const gRNA_PAM = sample.sample.gRNA_PAM;
    sample.sample.ref = ref.slice(
      ref.indexOf(gRNA_PAM) - windowSize,
      ref.indexOf(gRNA_PAM) + gRNA_PAM.length + windowSize
    );
    ref = sample.sample.ref;
    for (const res of sample.haplotype) {
      const pair = new AlignedPair(res.result[0], res.result[1], gRNA_PAM);
      const multi_res = pair.multi_result();
      result.res.push({
        query: multi_res.query,
        count: res.count,
        insertions: multi_res.insertions,
      });
    }
    // lowercase mutant loci & filter over-replaced haplotype
    for (const re of result.res) {
      let replacement_count = 0;
      let space_count = 0;
      for (let i = 0; i < ref.length - 1; i++) {
        if (re.query[i] === '-') {
          space_count += 1;
        } else if (
          re.query[i] !== ref[i] &&
          re.query[i] !== '-' &&
          ref[i] !== '-'
        ) {
          re.query =
            re.query.slice(0, i) +
            re.query[i].toLowerCase() +
            re.query.slice(i + 1);
          replacement_count += 1;
        }
      }
      if (
        ref.length - space_count < replacement_count * 2 ||
        replacement_count > 5
      )
        result.res.splice(result.res.indexOf(re), 1);
    }
    // remove duplicates
    result.res = result.res
      .map((line) => {
        let new_count = line.count;
        if (line.insertions.length === 0) {
          for (const line1 of result.res) {
            if (line.query === line1.query && line1.insertions.length === 0)
              new_count += line1.count;
          }
        }
        if (new_count !== line.count) new_count -= line.count;
        return {
          query: line.query,
          count: new_count,
          insertions: line.insertions,
        };
      })
      .filter(
        (ele, index, array) =>
          index ===
          array.findIndex((e) => JSON.stringify(e) === JSON.stringify(ele))
      );
    // sort by count
    result.res.sort((a, b) =>
      a.count < b.count ? 1 : a.count > b.count ? -1 : 0
    );
    result.sample.sumup = result.res.reduce((mem, val) => {
      mem += val.count;
      return mem;
    }, 0);
    resultset.push(result);
  }
  return resultset;
}

class AlignmentResult {
  target: HTMLElement;
  /**
   * Draws the alignment result.
   * @param group group name
   */
  constructor(id = 'alignment-result') {
    this.target = document.getElementById(id) as HTMLElement;
    this.target.style.textAlign = 'center';
    this.target.style.fontSize = '14px';
  }

  draw(data: multialign[], type: string) {
    this.target.replaceChildren();
    const tobeFiltered = this.mergeSample(data);
    let haplotypes;
    if (type === 'insertion') {
      haplotypes = tobeFiltered
        .filter((haplotype) => haplotype.insertions.length > 0)
        .splice(0, 15);
    } else if (type === 'substitution') {
      haplotypes = tobeFiltered
        .filter((haplotype) => haplotype.query.match('a|t|c|g'))
        .splice(0, 15);
    } else if (type === 'deletion') {
      haplotypes = tobeFiltered
        .filter((haplotype) => haplotype.query.match('-'))
        .splice(0, 15);
    } else {
      haplotypes = [] as {
        query: string;
        count: number;
        insertions: {
          index: number;
          sequence: string;
        }[];
      }[];
    }
    const sumup = data.reduce((mem, sampleinfo) => {
      return sampleinfo.sample.sumup + mem;
    }, 0);
    for (const haplotype of haplotypes) {
      const length = haplotype.query.length;
      const haplotype_target = document.createElement('div');
      const haplotype_count = document.createElement('span');
      haplotype_count.innerText =
        haplotype.count.toString() +
        ' (' +
        ((haplotype.count / sumup) * 100).toFixed(2) +
        '%)';
      haplotype_count.style.display = 'inline-block';
      haplotype_count.style.width = '20%';
      haplotype_target.style.width = '72%';
      haplotype_target.style.display = 'inline-block';
      haplotype_target.style.position = 'relative';
      const insertions = haplotype.insertions.map((val) => val.index);
      for (let base = 0; base < haplotype.query.length; base++) {
        const base_target = document.createElement('span');
        base_target.innerText = haplotype.query[base];
        base_target.style.display = 'inline-block';
        base_target.style.width = (100 / length).toString() + '%';
        const insertion_target = document.createElement('span');
        insertion_target.innerText = '▼';
        insertion_target.style.position = 'absolute';
        insertion_target.style.left =
          ((100 * base + 55) / length).toString() + '%';
        insertion_target.style.top = '-10px';
        switch (haplotype.query[base]) {
          case 'C':
          case 'c':
            base_target.style.backgroundColor = '#8a9fe3';
            break;
          case 'G':
          case 'g':
            base_target.style.backgroundColor = '#f2bc8d';
            break;
          case 'A':
          case 'a':
            base_target.style.backgroundColor = '#baf28d';
            break;
          case 'T':
          case 't':
            base_target.style.backgroundColor = '#f26389';
            break;
        }
        haplotype_target.appendChild(base_target);
        if (insertions.includes(base + 1)) {
          haplotype_target.appendChild(insertion_target);
        }
      }
      haplotype_target.classList.add('haplotype');
      this.target.appendChild(haplotype_target);
      this.target.appendChild(haplotype_count);
    }
  }

  private mergeSample(data: multialign[]) {
    const samples = data;
    return samples
      .reduce((memo, x) => {
        // concat sample results
        x.res.forEach((val) => memo.push(val));
        return memo;
      }, [] as haplotype[])
      .map((line, _, array) => {
        // merge sample results
        let new_count = line.count;
        if (line.insertions.length === 0) {
          array.map((sub) => {
            if (line.query === sub.query && sub.insertions.length === 0)
              new_count += sub.count;
          });
        }
        if (new_count !== line.count) new_count -= line.count;
        return {
          query: line.query,
          count: new_count,
          insertions: line.insertions,
        };
      })
      .filter(
        // remove duplicated results
        (ele, index, array) =>
          index ===
          array.findIndex((e) => JSON.stringify(e) === JSON.stringify(ele))
      )
      .sort(
        // sort by count
        (a, b) => (a.count < b.count ? 1 : a.count > b.count ? -1 : 0)
      );
  }
}

export { Sample, sampleAlign, AlignedPair, multiAlign, AlignmentResult };
