<template>
  <div class="row justify-center">
    <q-card class="col-12 col-md-10 col-xl-8">
      <q-card-section align="center">
        <img
          v-show="alignmentprgs <= 1"
          src="../assets/img/crisprstitch-pHY287.jpg"
          style="width: 100%"
        />
        <q-linear-progress
          rounded
          :value="readprgs"
          v-show="readprgs !== 0 && readprgs !== 1"
        />
        <q-badge
          color="white"
          text-color="primary"
          v-show="readprgs !== 1 && readprgs !== 0"
          :label="
            (readprgs * 100).toFixed(2) + '% Finish in : ' + estimated_remaining
          "
        />
        <!-- <q-linear-progress
          v-show="samplingprgs == 'pending'"
          indeterminate
          rounded
          color="accent"
        /> -->
        <q-linear-progress
          v-show="alignmentprgs <= 1 && alignmentprgs !== 0"
          rounded
          :value="alignmentprgs"
        />
        <q-badge
          color="white"
          text-color="primary"
          v-show="alignmentprgs <= 1 && alignmentprgs !== 0"
          :label="'Alignment: ' + (alignmentprgs * 100).toFixed(2) + '%'"
        />
        <SummaryTable v-if="summaryTable.length > 0" :table="summaryTable" />
      </q-card-section>
      <q-card-section v-show="alignmentprgs >= 1 && groupnames.length > 1">
        <q-select
          rounded
          v-model="group"
          :options="groupnames"
          @click="check"
          @update:model-value="groupAlign"
          label="Group"
        />
        <!-- todo: direct download of all data-->
        <!-- <q-btn
          color="primary"
          label="Download"
          @click="downloadAll"
          class="q-mt-md"
        /> -->
      </q-card-section>
      <q-card-section v-if="chartData && alignmentResult">
        <q-btn-toggle
          v-model="type"
          spread
          class="my-custom-toggle"
          no-caps
          rounded
          toggle-color="primary"
          color="white"
          text-color="primary"
          :options="[
            { label: 'Deletion', value: 'deletion' },
            { label: 'Insertion', value: 'insertion' },
            { label: 'Substitution', value: 'substitution' },
            { label: 'Deletion Size', value: 'deletion_size' },
            { label: 'Insertion Size', value: 'insertion_size' },
          ]"
          @update:model-value="refreshChart"
        />
        <AlignedChart
          ref="alignedChart"
          :type="type"
          :chartData="chartData"
          :alignmentResult="alignmentResult"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { useReadsStore } from 'src/stores/reads';
import { useSampleInfoStore } from 'src/stores/sampleinfo';
import { nextTick, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Notify, Loading } from 'quasar';
import { useWorkerStore } from 'src/stores/worker';
import { LocalStorage } from 'quasar';
import { Sample } from 'src/utils/alignment';
import AlignedChart from 'src/components/AlignedChart.vue';
import SummaryTable from 'src/components/SummaryTable.vue';
import workerURL from 'src/worker/alignment.worker?worker';

const readprgs = ref(0);
const alignmentprgs = ref(0);
const group = ref('');
const numcontig = ref(-1);
// const groupnames = ref<(string | undefined)[]>([]);
const groupnames = computed(() => useSampleInfoStore().groups);
const estimated_remaining = ref();

const type = ref('deletion');
const chartData = ref();
const alignmentResult = ref();

const alignedChart = ref();
const summaryTable = ref([] as { [key: string]: any }[]);
const router = useRouter();

let chart_data: {
  groupsvgjson: string;
  deletionChart: {
    [key: string]: any;
  };
  mutationChart: {
    [key: string]: any;
  };
  deletionSizeChart: {
    [key: string]: any;
  };
  multialignChart: {
    [key: string]: any;
  }[];
  insertionChart: {
    [key: string]: any;
  };
  insertionSizeChart: {
    [key: string]: any;
  };
};

const alignment = ref<
  {
    sample: Sample;
    res: {
      query: string;
      count: number;
      insertions: {
        index: number;
        sequence: string;
      }[];
    }[];
  }[]
>([]);

const align_worker = new workerURL();
align_worker.onmessage = ({
  data: { type, result },
}: {
  data: {
    type: string;
    result: {
      multi_result: {
        sample: Sample;
        res: {
          query: string;
          count: number;
          insertions: {
            index: number;
            sequence: string;
          }[];
        }[];
      }[];
      chart_data: {
        groupsvgjson: string;
        deletionChart: {
          [key: string]: any;
        };
        mutationChart: {
          [key: string]: any;
        };
        deletionSizeChart: {
          [key: string]: any;
        };
        multialignChart: {
          [key: string]: any;
        }[];
        insertionChart: {
          [key: string]: any;
        };
        insertionSizeChart: {
          [key: string]: any;
        };
      };
      progress: number;
      message: string;
      origin: number;
      sample: string;
    };
  };
}) => {
  switch (type) {
    case 'group':
      chart_data = result.chart_data;
      console.log(chart_data);
      chartData.value = chart_data.deletionChart;
      alignedChart.value.resetChart();
      Loading.hide();
      break;
    case 'all':
      alignment.value = result.multi_result;
      group.value = groupnames.value[0] as string;
      groupAlign(group.value);
      for (const sample of result.multi_result) {
        summaryTable.value.push(overviewSetup(sample));
      }
      Loading.hide();
      break;
    case 'progress':
      alignmentprgs.value = result.progress;
      break;
    case 'error':
      Notify.create({
        message:
          result.message +
          ': ' +
          result.origin +
          ' haplotypes from sample ' +
          result.sample +
          ' all filtered. Please modify the threshold.',
        color: 'negative',
        icon: 'report_problem',
        position: 'top',
        timeout: 0,
        actions: [
          {
            label: 'Dismiss',
            color: 'white',
            handler: () => {
              router.push('/');
            },
          },
        ],
      });
      break;
  }
};

const estimateTime = setInterval(() => {
  const remaining = useReadsStore().estimatedRemaining();
  const time = remaining / 1000;
  if (remaining === -1) {
    estimated_remaining.value = 'estimating...';
  } else if (remaining === 0) {
    estimated_remaining.value = '0';
  } else if (time < 60) {
    estimated_remaining.value = time.toFixed(2) + 's';
  } else if (time < 600) {
    estimated_remaining.value = (time / 60).toFixed(2) + 'm';
  } else estimated_remaining.value = '> 10m';
}, 1000);

useReadsStore().$subscribe((_, state) => {
  readprgs.value = state.progress;
  if (state.progress === 1) {
    clearInterval(estimateTime);
  }
});

if (useWorkerStore().worker) {
  (useWorkerStore().worker as Worker).onmessage = ({
    data: { type, result },
  }: {
    data: {
      type: string;
      result: number | string | { numcontigs: number; numtotal: number };
    };
  }) => {
    switch (type) {
      case 'progress':
        useReadsStore().changeProgress(result as number);
        break;
      case 'seq':
        const seq = result as string;
        try {
          if (LocalStorage.has(seq)) {
            const stored = LocalStorage.getItem(seq as string);
            const incremented = (stored as number) + 1;
            LocalStorage.set(seq, incremented);
          } else {
            LocalStorage.set(seq, 1);
          }
        } catch (e) {
          if (e instanceof DOMException) {
            console.log('LocalStorage is full, rearranging...');
            useSampleInfoStore().arrangeReads(LocalStorage.getAll());
            LocalStorage.clear();
            LocalStorage.set(seq, 1);
          }
        }
        break;
      case 'mergeResult':
        const mergeResult = result as { numcontigs: number; numtotal: number };
        numcontig.value = mergeResult.numcontigs;
        if (mergeResult.numcontigs / mergeResult.numtotal < 0.5) {
          Notify.create({
            message: `Combined only ${mergeResult.numcontigs} in ${mergeResult.numtotal} reads pairs.  Please check your input.`,
            color: 'negative',
            icon: 'report_problem',
            position: 'top',
            timeout: 0,
            actions: [
              {
                label: 'Dismiss',
                color: 'white',
                handler: () => {
                  router.push('/');
                  useWorkerStore().worker?.terminate();
                  useWorkerStore().$reset();
                  useSampleInfoStore().$reset();
                  LocalStorage.clear();
                },
              },
            ],
          });
        }
        useSampleInfoStore().arrangeReads(LocalStorage.getAll());
        align_worker.postMessage({
          type: 'all',
          samples: JSON.stringify(useSampleInfoStore().sampleInfo),
          threshold: useReadsStore().threshold.toString(),
        });
        try {
          useSampleInfoStore().checkSample();
        } catch (e) {
          Notify.create({
            message: (e as Error).message,
            color: 'negative',
            icon: 'report_problem',
            position: 'top',
            timeout: 0,
            actions: [
              {
                label: 'Dismiss',
                color: 'white',
                handler: () => {
                  router.push('/');
                  useWorkerStore().worker?.terminate();
                  useWorkerStore().$reset();
                  useSampleInfoStore().$reset();
                  LocalStorage.clear();
                },
              },
            ],
          });
        }
        setTimeout(() => {
          if (alignmentprgs.value < 1) {
            Notify.create({
              message:
                'Alignment is taking too long, please check your input. Consider resetting threshold.',
              color: 'negative',
              icon: 'report_problem',
              position: 'top',
              timeout: 0,
              actions: [
                {
                  label: 'return to homepage',
                  color: 'white',
                  handler: () => {
                    router.push('/');
                    useWorkerStore().worker?.terminate();
                    useWorkerStore().$reset();
                    useSampleInfoStore().$reset();
                    LocalStorage.clear();
                  },
                },
              ],
            });
          }
        }, 36000000);
        break;
      case 'error':
        Notify.create({
          message: result as string,
          color: 'negative',
          icon: 'report_problem',
          position: 'top',
          timeout: 0,
          actions: [
            {
              label: 'Dismiss',
              color: 'white',
              handler: () => {
                router.push('/');
                useWorkerStore().worker?.terminate();
                useWorkerStore().$reset();
                useSampleInfoStore().$reset();
                LocalStorage.clear();
              },
            },
          ],
        });
        break;
    }
  };
} else {
  router.push('/');
  Notify.create({
    message: 'Unexpected error! Redirected to homepage.',
    color: 'negative',
    icon: 'report_problem',
    position: 'top',
    timeout: 2000,
  });
}

function groupAlign(group: string) {
  const samples = useSampleInfoStore().sampleInfo.filter(
    (sample) => sample.group === group
  );
  if (
    !Object.values(samples).every(
      (sample, _, arr) => sample.targetSeq === arr[0].targetSeq
    )
  ) {
    Notify.create({
      message: `Samples in the group of <strong>${group}</strong> have different target sequences.`,
      color: 'negative',
      icon: 'report_problem',
      position: 'top',
      timeout: 0,
      actions: [
        {
          label: 'Dismiss',
          color: 'white',
          handler: () => {
            router.push('/');
            useWorkerStore().worker?.terminate();
            useWorkerStore().$reset();
            useSampleInfoStore().$reset();
            LocalStorage.clear();
          },
        },
      ],
      html: true,
    });
    return;
  }
  const groupAlignment = alignment.value
    .filter((sample) => sample.sample.group === group)
    .map((sample) => {
      const { res, ...rest } = sample;
      return {
        ...rest,
        res: res.slice(0, 2000), // reduce haplotype amount
      };
    });
  align_worker.postMessage({
    type: 'group',
    samples: JSON.stringify(groupAlignment),
  });
  alignmentResult.value = groupAlignment;
}

function refreshChart() {
  Loading.show({
    delay: 400,
  });
  switch (type.value) {
    case 'deletion':
      chartData.value = chart_data.deletionChart;
      break;
    case 'insertion':
      chartData.value = chart_data.insertionChart;
      break;
    case 'substitution':
      chartData.value = chart_data.mutationChart;
      break;
    case 'deletion_size':
      chartData.value = chart_data.deletionSizeChart;
      break;
    case 'insertion_size':
      chartData.value = chart_data.insertionSizeChart;
      break;
  }
  nextTick(() => {
    alignedChart.value.resetChart();
    Loading.hide();
  });
}

function check() {
  console.log('groups: ', groupnames.value);
  console.log('group: ', group.value);
  console.log(summaryTable);
}

function overviewSetup(data: {
  sample: Sample;
  res: {
    query: string;
    count: number;
    insertions: { index: number; sequence: string }[];
  }[];
}) {
  const tc = data.sample.sumup as number;
  let [mc, rc, ioc, doc, idc] = [0, 0, 0, 0, 0];
  const reduced_res = data.res.slice(0, 5000); // reduce haplotype amount
  for (const re of reduced_res) {
    if (re.query === data.sample.ref && re.insertions.length == 0) {
      mc = tc - re.count;
    } else {
      if (re.query.match(/a|t|c|g/)) {
        rc += re.count;
      }
      if (re.query.match('-')) {
        if (re.insertions.length == 0) {
          doc += re.count;
        } else {
          idc += re.count;
        }
      } else if (re.insertions.length != 0) {
        ioc += re.count;
      }
    }
  }
  if (mc == 0) mc = tc;
  const [mr, rr, ior, dor, idr] = [
    setDecimalPrecision((mc / tc) * 100, 2),
    setDecimalPrecision((rc / tc) * 100, 2),
    setDecimalPrecision((ioc / tc) * 100, 2),
    setDecimalPrecision((doc / tc) * 100, 2),
    setDecimalPrecision((idc / tc) * 100, 2),
  ];
  return {
    Sample: data.sample.name,
    mutation: mr,
    substitution: rr,
    'insertion only': ior,
    'deletion only': dor,
    'insertion&deletion': idr,
    'mutation count': mc,
    'substitution count': rc,
    'insertion only count': ioc,
    'deletion only count': doc,
    'insertion&deletion count': idc,
    'total read count': tc,
  };
}

function setDecimalPrecision(num: number, precision: number): string {
  const roundedNum =
    Math.round((num + Number.EPSILON) * 10 ** precision) / 10 ** precision;
  const numStr = roundedNum.toFixed(precision);
  return numStr;
}
</script>
