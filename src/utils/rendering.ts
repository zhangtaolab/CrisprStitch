import { AlignedPair, Sample } from './alignment';

const azip = (rows: any) =>
  rows[0].map((_: any, c: any) => rows.map((row: any) => row[c]));

/**
 * standard deviation
 * @param arr
 * @param usePopulation
 */
function tstd(arr: number[], usePopulation = false) {
  if (arr.length == 1) return 0;
  const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
  return Math.sqrt(
    arr
      .reduce((acc, val) => acc.concat((val - mean) ** 2), [] as number[])
      .reduce((acc, val) => acc + val, 0) /
    (arr.length - (usePopulation ? 0 : 1))
  );
}

/**
 * prepare xaxis and bar value for histograms
 * @param ref reference string
 * @param gRNA_PAM gRNA string (PAM no need but call it gRNA_PAM)
 * @param raw data arranged
 * @returns
 */
function prepareVal(
  ref: string,
  gRNA_PAM: string,
  raw: number[][],
  windowSize = 30
): { [key: string]: any } {
  const xaxis = ref
    .slice(ref.indexOf(gRNA_PAM) - windowSize, ref.indexOf(gRNA_PAM))
    .split('')
    .concat(
      gRNA_PAM
        .split('')
        .map((val) => ({ value: val, textStyle: { color: 'red' } })) as any[]
    )
    .concat(
      ref
        .slice(
          ref.indexOf(gRNA_PAM) + gRNA_PAM.length,
          ref.indexOf(gRNA_PAM) + gRNA_PAM.length + windowSize
        )
        .split('')
    );
  return raw.length > 1
    ? (azip(raw) as number[][]).reduce(
      (mem, val, index) => {
        const avg = val.reduce((a, b) => a + b, 0) / val.length || 0;
        const error = tstd(val, true) / Math.sqrt(val.length);
        mem.bar.push(avg);
        mem.errorbar.push([
          index,
          avg + error,
          error > avg ? 0 : avg - error,
        ]);
        return mem;
      },
      {
        xaxis: xaxis,
        bar: [] as number[],
        errorbar: [] as number[][],
        state: 'success',
      }
    )
    : (azip(raw) as number[][]).reduce(
      (mem, val) => {
        mem.bar.push(val.reduce((a, b) => a + b, 0) / val.length || 0);
        return mem;
      },
      {
        xaxis: xaxis,
        bar: [] as number[],
        errorbar: undefined,
        state: 'warning',
      }
    );
}

function deletionChartData(
  groupres: {
    sample: Sample;
    res: {
      query: string;
      count: number;
      insertions: { index: number; sequence: string }[];
    }[];
  }[]
) {
  const gRNA_PAM = groupres[0].sample.gRNA_PAM;
  const ref = groupres[0].sample.ref as string;
  const deletions = groupres.map((sample) => {
    const sumup = sample.sample.sumup as number;
    const deletion = [...Array(100 + gRNA_PAM.length)].map(() => 0);
    for (const res of sample.res) {
      const pair = new AlignedPair(ref, res.query, gRNA_PAM);
      for (let i = 0; i < ref.length; i++) {
        if (pair.multi_result().query[i] === '-') {
          deletion[i] += (res.count / sumup) * 100;
        }
      }
    }
    return deletion;
  });
  const res = prepareVal(ref, gRNA_PAM, deletions);
  res.type = 'Deletion';
  return res;
}

function mutationChartData(
  groupres: {
    sample: Sample;
    res: {
      query: string;
      count: number;
      insertions: { index: number; sequence: string }[];
    }[];
  }[]
) {
  const gRNA_PAM = groupres[0].sample.gRNA_PAM;
  const ref = groupres[0].sample.ref!;
  const mutations = groupres.map((sample) => {
    const sumup = sample.sample.sumup!;
    const mutation = [...Array(100 + gRNA_PAM.length)].map(() => 0);
    for (const res of sample.res) {
      const pair = new AlignedPair(ref, res.query, gRNA_PAM);
      for (let i = 0; i < ref.length; i++) {
        if (pair.multi_result().query[i].match(/(a|t|c|g)/)) {
          mutation[i] += (res.count / sumup) * 100;
        }
      }
    }
    return mutation;
  });
  const res = prepareVal(ref, gRNA_PAM, mutations);
  res.type = 'mutation';
  return res;
}

function insertionChartData(
  groupres: {
    sample: Sample;
    res: {
      query: string;
      count: number;
      insertions: { index: number; sequence: string }[];
    }[];
  }[]
) {
  const gRNA_PAM = groupres[0].sample.gRNA_PAM;
  const ref = groupres[0].sample.ref as string;
  const insertions = groupres.map((sample) => {
    const sumup = sample.sample.sumup as number;
    const insertion = [...Array(100 + gRNA_PAM.length)].map((_) => 0);
    for (const res of sample.res) {
      for (const insert of res.insertions) {
        insertion[insert.index] += (res.count / sumup) * 100;
      }
    }
    return insertion;
  });
  const res = prepareVal(ref, gRNA_PAM, insertions);
  res.type = 'Insertion';
  return res;
}

function deletionSizeChartData(
  groupres: {
    sample: Sample;
    res: {
      query: string;
      count: number;
      insertions: { index: number; sequence: string }[];
    }[];
  }[]
) {
  const counts_all: [string, number][][] = [];
  const gRNA_PAM = groupres[0].sample.gRNA_PAM;
  const ref = groupres[0].sample.ref!;
  for (const sample of groupres) {
    const counts: [string, number][] = [];
    for (const res of sample.res) {
      const pair = new AlignedPair(ref, res.query, gRNA_PAM);
      let count = 0;
      for (let i = 0; i < pair.multi_result().query.length; i++) {
        if (pair.multi_result().query[i] === '-') {
          count += 1;
          if (pair.multi_result().query[i + 1] !== '-') {
            if (count > 20) {
              if (counts.find((val) => val[0] === '>20')) {
                counts[counts.findIndex((e) => e[0] === '>20')][1] += res.count;
              } else {
                counts.push(['>20', res.count]);
              }
            } else {
              if (counts.find((val) => val[0] === count.toString())) {
                counts[counts.findIndex((e) => e[0] === count.toString())][1] +=
                  res.count;
              } else {
                counts.push([count.toString(), res.count]);
              }
            }
            count = 0;
          }
        }
      }
    }
    counts_all.push(counts);
  }
  const series = [];
  const countlist: string[] = [];
  const SEM: number[][] = [];
  const res: [string, ...number[]][] = [];
  for (const sample of counts_all) {
    // first sort function puts '>20' string to the tail, second sort function sorts numbers
    sample.sort().sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    sample.map((e) => {
      if (res.find((val) => val[0] === e[0])) {
        res[res.findIndex((val) => val[0] === e[0])].push(e[1]);
      } else {
        countlist.push(e[0]);
        res.push(e);
      }
    });
  }
  let i = 0;
  countlist.sort().sort((a, b) => parseInt(a) - parseInt(b));
  res.sort().sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  for (const c of res) {
    const avg =
      (c.slice(1) as number[]).reduce((a, b) => a + b, 0) / counts_all.length ||
      0;
    series.push(avg);
    const error = tstd(c.slice(1) as number[]) / Math.sqrt(counts_all.length);
    SEM.push([i, avg + error, error > avg ? 0 : avg - error]);
    i++;
  }
  return groupres.length > 1
    ? {
      type: 'Deletion size',
      xaxis: countlist,
      bar: series,
      errorbar: SEM,
      state: 'success',
    }
    : {
      type: 'Deletion size',
      xaxis: countlist,
      bar: series,
      errorbar: undefined,
      state: 'success',
    };
}

function insertionSizeChartData(
  groupres: {
    sample: Sample;
    res: {
      query: string;
      count: number;
      insertions: { index: number; sequence: string }[];
    }[];
  }[]
) {
  const counts_all: [string, number][][] = [];
  for (const sample of groupres) {
    const counts: [string, number][] = [];
    for (const res of sample.res) {
      for (const ins of res.insertions) {
        if (ins.sequence.length > 20) {
          if (counts.find((val) => val[0] === '>20')) {
            counts[counts.findIndex((e) => e[0] === '>20')][1] += res.count;
          } else {
            counts.push(['>20', res.count]);
          }
        } else {
          if (counts.find((val) => val[0] === ins.sequence.length.toString())) {
            counts[
              counts.findIndex((e) => e[0] === ins.sequence.length.toString())
            ][1] += res.count;
          } else {
            counts.push([ins.sequence.length.toString(), res.count]);
          }
        }
      }
    }
    counts_all.push(counts);
  }
  const series = [];
  const countlist: string[] = [];
  const SEM: number[][] = [];
  const res: [string, number][] = [];
  for (const sample of counts_all) {
    sample.sort();
    sample.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    sample.map((e) => {
      if (res.find((val) => val[0] === e[0])) {
        res[res.findIndex((val) => val[0] === e[0])].push(e[1]);
      } else {
        countlist.push(e[0]);
        res.push(e);
      }
    });
  }
  let i = 0;
  countlist.sort();
  countlist.sort((a, b) => parseInt(a) - parseInt(b));
  res.sort();
  res.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  for (const c of res) {
    const avg =
      (c.slice(1) as number[]).reduce((a, b) => a + b, 0) / counts_all.length ||
      0;
    series.push(avg);
    const error = tstd(c.slice(1) as number[]) / Math.sqrt(counts_all.length);
    SEM.push([i, avg + error, error > avg ? 0 : avg - error]);
    i++;
  }
  return groupres.length > 1
    ? {
      type: 'Insertion size',
      xaxis: countlist,
      bar: series,
      errorbar: SEM,
      state: 'success',
    }
    : {
      type: 'Insertion size',
      xaxis: countlist,
      bar: series,
      errorbar: undefined,
      state: 'success',
    };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function groupScratch(
  alignment: {
    sample: Sample;
    res: {
      query: string;
      count: number;
      insertions: { index: number; sequence: string }[];
    }[];
  }[]
) {
  console.log(alignment)
  alignment.map((group) => ({
    sample: group.sample,
    res: group.res,
  }));
  const svgJSON = {
    groupsvgjson: alignment[0].sample.group,
    deletionChart: deletionChartData(alignment),
    mutationChart: mutationChartData(alignment),
    deletionSizeChart: deletionSizeChartData(alignment),
    multialignChart: alignment,
    insertionChart: insertionChartData(alignment),
    insertionSizeChart: insertionSizeChartData(alignment),
  };
  return svgJSON;
}
