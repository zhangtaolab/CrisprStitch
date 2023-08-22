<template>
  <q-file
    :multiple="max_files > 1"
    :append="max_files > 1"
    ref="filePicker"
    filled
    bottom-slots
    v-model="model"
    :label="label"
    counter
    :max-files="max_files"
    @update:model-value="onChange"
  >
    <template v-slot:before>
      <q-icon name="folder_open" />
    </template>

    <template v-slot:hint>
      {{ hint }}
    </template>

    <template v-slot:append>
      <q-icon
        round
        dense
        flat
        name="close"
        @click.stop.prevent="() => (model = null)"
        class="cursor-pointer"
      />
    </template>
  </q-file>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Fasta } from 'src/utils/fasta';
import { useSampleInfoStore } from 'src/stores/sampleinfo';
import { useWorkerStore } from 'src/stores/worker';
import { Notify } from 'quasar';
import { unzip } from 'src/utils/fflater';

const model = ref(null);

const props = defineProps({
  hint: {
    type: String,
    default: 'Field hint',
    required: true,
  },
  label: {
    type: String,
    default: 'Label',
    required: true,
  },
  max_files: {
    type: Number,
    default: 1,
  },
  onChangeCallback: {
    type: Function,
    default: null,
  },
  accept: {
    type: String,
    default: '*',
  },
});

const onChange = (value: File) => {
  if (props.onChangeCallback) {
    props.onChangeCallback(value);
  }
};

const readReads = () => {
  const sampleinfo = useSampleInfoStore();
  if (sampleinfo.count > 20) {
    Notify.create({
      message:
        'Caution! More than 20 samples detected. Please consider split your samples.',
      color: 'accent',
      position: 'top',
    });
  }
  if (model.value) {
    const worker = useWorkerStore();
    worker.initWorker();
    (worker.worker as Worker).postMessage({
      filea: model.value[0],
      fileb: model.value[1],
      barcodeLength: sampleinfo.barcodeLength,
    });
    // console.log('fflate testing...')
    // unzip(model.value)
  } else {
    Notify.create({
      message: 'Reads file not selected.',
      color: 'negative',
    });
  }
};

const readTargetSeq = async () => {
  if (model.value) {
    const fa = new Fasta(model.value);
    const sampleinfo = useSampleInfoStore();
    for await (const seq of fa) {
      sampleinfo.targetSeq(seq);
    }
  } else {
    Notify.create({
      message: 'Target sequence file not selected.',
      color: 'negative',
    });
  }
};

defineExpose({
  readReads,
  readTargetSeq,
});
</script>
