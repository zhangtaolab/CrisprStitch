<template>
  <div class="row justify-center">
    <q-card class="col-12 col-md-10 col-xl-6">
      <q-card-section>
        <q-linear-progress
          rounded
          :value="readprgs"
          v-show="readprgs !== 0 && readprgs !== 1"
        />
        <q-badge
          color="white"
          text-color="primary"
          :label="(readprgs * 100).toFixed(2) + '%'"
        />
        <q-linear-progress
          v-show="samplingprgs == 'pending'"
          indeterminate
          rounded
          color="accent"
        />
      </q-card-section>
      <q-card-section v-show="readprgs === 1 && samplingprgs === 'success'">
        <q-select
          rounded
          v-model="group"
          :option="useSampleInfoStore().groups"
        />
      </q-card-section>
      <q-card-section> </q-card-section>
    </q-card>
    <q-btn @click="showsample">showsample</q-btn>
  </div>
</template>

<script setup lang="ts">
import { useReadsStore } from 'src/stores/reads';
import { useSampleInfoStore } from 'src/stores/sampleinfo';
import { ref } from 'vue';

const readprgs = ref(0);
const samplingprgs = ref('not ready');
const group = ref();
const groups = ref<(string | undefined)[]>([]);

useReadsStore().$subscribe((_, state) => {
  readprgs.value = state.progress;
});

useSampleInfoStore().$subscribe((_, state) => {
  samplingprgs.value = state.progress;
  if (state.progress === 'success') {
    groups.value = useSampleInfoStore().groups;
    group.value = groups.value[0];
  }
});

function showsample() {
  console.log(useReadsStore().sumUp);
  console.log(useSampleInfoStore().$state);
  console.log(useSampleInfoStore().sumUp);
}
</script>
