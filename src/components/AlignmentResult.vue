<template>
  <div style="text-align: center; font-size: 1em">
    <div v-for="(haplotype, key) in haplotypes" v-bind:key="haplotype.index">
      <div
        v-for="insertion in haplotype.insertions"
        v-show="toggle[key]"
        v-bind:key="insertion.index"
        style="width: 72%; display: inline-block; position: relative"
      >
        <span
          :style="{
            position: 'absolute',
            left:
              (
                (100 * insertion.index) / haplotype.query.length -
                14
              ).toString() + '%',
            top: '-1.2em',
            borderBottom: '1px solid',
          }"
          >{{ insertion.sequence }}</span
        >
      </div>
      <div style="width: 72%; display: inline-block; position: relative">
        <span v-for="(char, index) in haplotype.query" v-bind:key="index">
          <span
            v-if="char === 'a' || char === 'A'"
            :style="{
              backgroundColor: '#baf28d',
              display: 'inline-block',
              width: (100 / haplotype.query.length).toString() + '%',
            }"
            >{{ char }}</span
          >
          <span
            class="base"
            v-else-if="char === 't' || char === 'T'"
            :style="{
              backgroundColor: '#f26389',
              display: 'inline-block',
              width: (100 / haplotype.query.length).toString() + '%',
            }"
            >{{ char }}</span
          >
          <span
            class="base"
            v-else-if="char === 'c' || char === 'C'"
            :style="{
              backgroundColor: '#8a9fe3',
              display: 'inline-block',
              width: (100 / haplotype.query.length).toString() + '%',
            }"
            >{{ char }}</span
          >
          <span
            class="base"
            v-else-if="char === 'g' || char === 'G'"
            :style="{
              backgroundColor: '#f2bc8d',
              display: 'inline-block',
              width: (100 / haplotype.query.length).toString() + '%',
            }"
            >{{ char }}</span
          >
          <span
            class="base"
            v-else-if="char === '-'"
            :style="{
              backgroundColor: '#9e9e9e',
              display: 'inline-block',
              width: (100 / haplotype.query.length).toString() + '%',
            }"
            >{{ char }}</span
          >
        </span>
        <span
          v-for="insertion in haplotype.insertions"
          v-bind:key="insertion.index"
          :style="{
            position: 'absolute',
            left:
              (
                (100 * insertion.index - 65) /
                haplotype.query.length
              ).toString() + '%',
            top: '-10px',
          }"
        >
          ▼
        </span>
      </div>
      <q-toggle
        v-show="haplotype.insertions.length > 0"
        size="xs"
        style="width: 10%"
        v-model="toggle[key]"
      ></q-toggle>
      <span
        :style="{
          width: haplotype.insertions.length > 0 ? '10%' : '20%',
          display: 'inline-block',
        }"
      >
        {{
          haplotype.count.toString() +
          ' (' +
          ((haplotype.count / sumup) * 100).toFixed(2) +
          '%)'
        }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { multialign, haplotype as hap } from 'src/stores/interface';
import { computed, reactive, watch } from 'vue';

const props = defineProps({
  data: {
    type: Array<multialign>,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

const sumup = props.data.reduce((mem, sampleinfo) => {
  return sampleinfo.sample.sumup + mem;
}, 0);

const mergeSample = (data: multialign[]) => {
  const samples = data;
  return samples
    .reduce((memo, x) => {
      // concat sample results
      x.res.forEach((val) => memo.push(val));
      return memo;
    }, [] as hap[])
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
};

const haplotypes = computed(() => {
  const tobeFiltered = mergeSample(props.data);
  let filteredData: {
    query: string;
    count: number;
    insertions: {
      index: number;
      sequence: string;
    }[];
  }[] = [];

  if (props.type === 'insertion') {
    filteredData = tobeFiltered.filter((x) => x.insertions.length > 0);
  } else if (props.type === 'substitution') {
    filteredData = tobeFiltered.filter((x) => x.query.match('a|t|c|g'));
  } else if (props.type === 'deletion') {
    filteredData = tobeFiltered.filter((x) => x.query.match('-'));
  }

  const result = filteredData.slice(0, 15).map((x, index) => {
    return {
      index: index,
      query: x.query,
      count: x.count,
      insertions: x.insertions,
    };
  });

  return result;
});

const toggle = reactive<Record<string | number, boolean>>({});

watch(
  haplotypes,
  (newHaplotypes) => {
    Object.keys(toggle).forEach((key) => {
      delete toggle[key];
    });

    newHaplotypes.forEach((_, index) => {
      toggle[index] = false;
    });
  },
  { immediate: true }
);
</script>
