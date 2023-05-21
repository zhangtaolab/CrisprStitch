<template>
  <div class="q-pa-md">
    <q-stepper v-model="step" ref="stepper" color="primary" animated>
      <q-step
        :name="1"
        title="Input Sample information"
        icon="settings"
        :done="step > 1"
      >
        <img style="width: 100%" class="image" src="../assets/img/step1.gif" />
        <p>1.1 Import sample information separately or by a file.</p>
        <p>1.2 Check and config sample information in the reactive table.</p>
      </q-step>

      <q-step
        :name="2"
        title="Input sequenceing data"
        caption="Optional"
        icon="create_new_folder"
        :done="step > 2"
      >
        <img style="width: 100%" class="image" src="../assets/img/step2.gif" />
        <p>2 Import FASTQ files and target site sequences.</p>
      </q-step>

      <q-step :name="3" title="Get result" icon="assignment">
        <img style="width: 100%" class="image" src="../assets/img/step3.gif" />
        <p>3.1 The first part is a summary table.</p>
        <p>3.2 Downloadable charts for each group are provided.</p>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn
            @click="stepper.next()"
            color="primary"
            v-if="step !== 3"
            label="Continue"
          />
          <q-btn
            to="/input"
            color="primary"
            v-if="step === 3"
            label="Get Start"
          />
          <q-btn
            v-if="step > 1"
            flat
            color="primary"
            @click="stepper.previous()"
            label="Back"
            class="q-ml-sm"
          />
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const step = ref(1);
const stepper = ref();

function next() {
  if (step.value === 3) {
  }
}
</script>
