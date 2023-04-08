<template>
  <div class="row justify-center q-gutter-xl">
    <div class="col-5 col-md-4 col-lg-3">
      <q-input
        filled
        v-model="barcode_Lset.value[parseInt(position.split('-')[0])]"
        label="barcode_L"
        :rules="[required, validSeq]"
      >
        <template #prepend>
          <q-icon name="arrow_downward" />
        </template>
      </q-input>
    </div>
    <div class="col-5 col-md-4 col-lg-3">
      <q-input
        filled
        v-model="barcode_Rset.value[parseInt(position.split('-')[1])]"
        label="barcode_R"
        :rules="[required, validSeq]"
      >
        <template #prepend>
          <q-icon name="arrow_forward" />
        </template>
      </q-input>
    </div>
  </div>
  <div class="row justify-center">
    <div class="col">
      <q-card>
        <q-card-section>
          <div class="row justify-center">
            <div
              class="col-1"
              v-for="col of cols"
              :key="col"
              :span="2"
              style="text-align: center"
            >
              <span class="row" style="display: table; margin: 0 1em">{{
                col + 1
              }}</span>
              <div class="row">
                <q-radio
                  class="col-12"
                  v-for="row of rows"
                  :unchecked-icon="
                    barcode_Lset.value[row] && barcode_Rset.value[col]
                      ? 'check_circle'
                      : 'panorama_fish_eye'
                  "
                  v-model="position"
                  :key="row"
                  :val="row + '-' + col"
                  :label="col == 11 ? String.fromCharCode(row + 65) : ''"
                  style="height: 30px; line-height: 30px"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
  <br />
  <q-form ref="form" @submit.prevent="onAdd" @validation-error="validate">
    <q-input
      ref="name"
      v-model="formInline.name"
      label="Sample name"
      placeholder="4239_rep1"
      :rules="[required]"
    />
    <q-input
      ref="gene"
      v-model="formInline.gene"
      label="Gene name"
      placeholder="Blc"
      :rules="[required]"
    />
    <q-input
      ref="group"
      v-model="formInline.group"
      label="Group"
      placeholder="(Optional)"
    />
    <q-input
      ref="gRNA_PAM"
      v-model="formInline.gRNA_PAM"
      label="gRNA_PAM"
      placeholder="tttgGAGTGAAATCTCTTGTCTTAAGG"
      :rules="[required, validSeq]"
    />
    <div style="margin-top: 5px">
      <q-btn label="Add" type="submit" color="primary" />
      <q-btn
        label="Example"
        @click="example"
        color="primary"
        flat
        class="q-ml-sm"
      />
    </div>
  </q-form>
</template>

<script lang="ts" setup>
import { Notify } from 'quasar';
import { reactive, ref, nextTick } from 'vue';
import { useSampleInfoStore } from '../../stores/sampleinfo';
import { required, validSeq } from '../../utils/validator';

const cols = Array.from(Array(12).keys());
const rows = Array.from(Array(8).keys());

const position = ref<string>('0-0');
const barcode_Lset = reactive({ value: Array(12).fill('') });
const barcode_Rset = reactive({ value: Array(8).fill('') });
const formInline = reactive({
  name: '',
  gene: '',
  group: '',
  gRNA_PAM: '',
} as any);
const form = ref();

const onAdd = () => {
  const sampleInfo = useSampleInfoStore();
  formInline.barcode_L =
    barcode_Lset.value[parseInt(position.value.split('-')[0])];
  formInline.barcode_R =
    barcode_Rset.value[parseInt(position.value.split('-')[1])];
  const clone = JSON.parse(JSON.stringify(formInline));
  if ((clone.group = '')) clone.group = 'None';
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
  nextTick(() => {
    form.value.resetValidation();
  });
};

const example = () => {
  position.value = '0-0';
  barcode_Lset.value[0] = 'TTAGGC';
  barcode_Rset.value[0] = 'TGACCA';
  formInline.name = 'TX-2';
  formInline.gene = 'OsPDS-site01';
  formInline.group = 'pYPQ203-AsCpf1-OsPDS-crRNA01';
  formInline.gRNA_PAM = 'tttgGAGTGAAATCTCTTGTCTTAAGG';
  formInline.barcode_L = 'TTAGGC';
  formInline.barcode_R = 'TGACCA';
};
</script>

<style scoped>
.row.justify-center {
  margin-bottom: 5px;
}
</style>
