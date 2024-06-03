<template>
  <div v-for="haplotype in haplotypes" v-bind:key="haplotype.query">
    <div style="width: 72%; display: inline-block; position: relative">
      <span v-for="char in haplotype.query" v-bind:key="char">
        <span
          v-if="char === 'a' || char === 'A'"
          style="background-color: #baf28d"
          >{{ char }}</span
        >
        <span
          v-else-if="char === 't' || char === 'T'"
          style="background-color: #f26389"
          >{{ char }}</span
        >
        <span
          v-else-if="char === 'c' || char === 'C'"
          style="background-color: #8a9fe3"
          >{{ char }}</span
        >
        <span
          v-else-if="char === 'g' || char === 'G'"
          style="background-color: #f2bc8d"
          >{{ char }}</span
        >
        <span v-else-if="char === '-'" style="background-color: #9e9e9e">{{
          char
        }}</span>
      </span>
    </div>
    <span
      v-for="insertion in haplotype.insertions"
      v-bind:key="insertion.index"
      style="position: absolute"
    >
      ▼
    </span>
    <span style="width: 20%; display: inline-block">
      {{
        haplotype.count.toString() +
        ' (' +
        ((haplotype.count / sumup) * 100).toFixed(2) +
        '%)'
      }}
    </span>
  </div>
</template>

<script setup lang="ts">
import multialign from 'src/stores/interface';

const props = defineProps({
  data: {
    type: Array<multialign>,
    required: true,
  },
  type: {
    type: string,
    required: true,
  },
});

const haplotypes = computed(() => {
  const tobeFiltered = mergeSample(props.data);
  if (type === 'insertion') {
    return tobeFiltered.filter((x) => x.insertions.length > 0).splice(0, 15);
  } else if (type === 'substitution') {
    return tobeFiltered.filter((x) => x.query.match('a|t|c|g')).splice(0, 15);
  } else if (type === ' deletion') {
    return tobeFiltered.filter((x) => x.query.match('-')).splice(0, 15);
  } else {
    return [];
  }
});

const mergeSample = (data: multialign[]) => {
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
};
</script>
