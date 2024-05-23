<template>
  <q-form ref="form" @submit.prevent="onAdd" @validation-error="validate">
    <q-input
      v-model="formInline.name"
      :rules="[required]"
      label="Sample Name"
      ref="name"
      placeholder="4239_rep1"
    />
    <q-input
      v-model="formInline.gene"
      :rules="[required]"
      label="Gene Name"
      ref="gene"
      placeholder="Blc"
    />
    <q-input
      v-model="formInline.gRNA_PAM"
      :rules="[required, validSeq]"
      label="Target Sequence"
      ref="gRNA_PAM"
      placeholder="tttgGAGTGAAATCTCTTGTCTTAAGG"
    />
    <q-input
      v-model="formInline.barcode_L"
      :rules="[validSeq]"
      label="Barcode L"
      ref="barcode_L"
      placeholder="TTAGGC"
      :disable="non_barcode"
    />
    <q-input
      v-model="formInline.barcode_R"
      :rules="[validSeq]"
      label="Barcode R"
      ref="barcode_R"
      placeholder="TGACCA"
      :disable="non_barcode"
    />
    <q-input
      v-model="formInline.group"
      label="Group Name"
      ref="group"
      placeholder="(Optional)"
    />
    <br />
    <q-btn type="submit" color="primary" label="Add" />
    <q-btn
      color="primary"
      label="Example"
      @click="example"
      flat
      class="q-ml-sm"
    />
    <q-toggle v-model="non_barcode" label="non-barcode mode" />
  </q-form>
</template>

<script lang="ts" setup>
import { Notify } from 'quasar';
import { ref, reactive, nextTick } from 'vue';
import { useSampleInfoStore } from '../../stores/sampleinfo';
import { required, validSeq } from '../../utils/validator';
import { Sample } from '../../stores/interface';

const non_barcode = ref(false);

const formInline = reactive<Sample>({
  name: '',
  gene: '',
  group: '',
  gRNA_PAM: '',
  barcode_L: '',
  barcode_R: '',
});
const form = ref();

const onAdd = () => {
  const sampleInfo = useSampleInfoStore();
  const barcode_L = formInline.barcode_L
    ? non_barcode.value
      ? 'None'
      : formInline.barcode_L.toUpperCase()
    : 'None';
  const barcode_R = formInline.barcode_R
    ? non_barcode.value
      ? 'None'
      : formInline.barcode_R.toUpperCase()
    : 'None';
  const clone: Sample = {
    name: formInline.name,
    gene: formInline.gene,
    group: formInline.group ? formInline.group : 'None',
    gRNA_PAM: formInline.gRNA_PAM.toUpperCase(),
    barcode_L: barcode_L,
    barcode_R: barcode_R,
  };
  sampleInfo.addSample(clone);
  resetForm();
};

const validate = () => {
  Notify.create({
    message: 'Please validate the form.',
    icon: 'announcement',
  });
};

const resetForm = () => {
  formInline.name = '';
  formInline.gene = '';
  formInline.group = '';
  formInline.gRNA_PAM = '';
  formInline.barcode_L = '';
  formInline.barcode_R = '';
  nextTick(() => {
    form.value.resetValidation();
  });
};

const example = () => {
  formInline.name = 'TX-2';
  formInline.gene = 'OsPDS-site01';
  formInline.group = 'pYPQ203-AsCpf1-OsPDS-crRNA01';
  formInline.gRNA_PAM = 'tttgGAGTGAAATCTCTTGTCTTAAGG';
  formInline.barcode_L = 'TTAGGC';
  formInline.barcode_R = 'TGACCA';
};
</script>
