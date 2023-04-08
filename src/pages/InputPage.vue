<template>
  <div class="row justify-center">
    <div class="col-8 col-md-6">
      <q-btn-toggle
        v-model="inputMode"
        spread
        class="my-custom-toggle"
        no-caps
        rounded
        toggle-color="primary"
        color="white"
        text-color="primary"
        :options="[
          { label: 'Separately', value: 'one' },
          { label: 'By file', value: 'two' },
          { label: '96 well plate', value: 'three' },
        ]"
      />
    </div>
  </div>
  <div class="row justify-center">
    <q-card class="col-12 col-md-10 col-xl-6">
      <q-card-section>
        <sample-form v-if="inputMode === 'one'" />
        <div class="row justify-center" v-if="inputMode === 'two'">
          <file-picker
            ref="sampleInput"
            class="col-8"
            hint="xls / xlsx / csv / tsv"
            label="Sample info"
            :on-change-callback="checkFileSure"
            accept=".xls, .xlsx, .csv, .tsv"
          />
          <q-btn
            color="primary"
            label="Example"
            @click="example"
            flat
            class="q-ml-sm"
          />
        </div>
        <well-plate v-if="inputMode === 'three'" />
      </q-card-section>
      <q-card-section>
        <sample-table :sample-info="sampleInfo" />
      </q-card-section>
      <q-card-section>
        <div class="row q-gutter-md justify-center">
          <file-picker
            ref="readsPicker"
            class="col-5"
            hint="fastq"
            label="Read"
            :max_files="2"
            accept=".fq, .fastq, .fq.gz, .fastq.gz"
          />
          <file-picker
            ref="targetPicker"
            class="col-5"
            hint="fasta"
            label="Target region"
            accept=".fa, .fasta, .fa.gz, .fasta.gz"
          />
        </div>
        <div class="row justify-center">
          <q-btn
            color="primary"
            @click="toresult()"
            label="Start"
            size="large"
            icon="directions"
          />
        </div>
      </q-card-section>
      <div ref="testDiv"></div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import FilePicker from '../components/FilePicker.vue';
import WellPlate from 'src/components/sampleInfo/WellPlate.vue';
import SampleForm from 'src/components/sampleInfo/sampleForm.vue';
import SampleTable from 'src/components/sampleInfo/SampleTable.vue';
import * as xlsx from 'xlsx';
import { ref } from 'vue';
import { useSampleInfoStore } from '../stores/sampleinfo';
import { Sample } from '../stores/interface';
import { Table } from '../utils/sampleTable';
import { Notify } from 'quasar';

const inputMode = ref('one');
const sampleInfo = ref<Sample[]>([]);
const sampleInput = ref();
const readsPicker = ref();
const targetPicker = ref();
const testDiv = ref();
const sampleInfoStore = useSampleInfoStore();

sampleInfoStore.$subscribe((_, state) => (sampleInfo.value = state.sampleInfo));

const checkFileSure = (file: File) => {
  new Table(file).read((table) => {
    table.forEach((line) => {
      try {
        sampleInfoStore.addSample({
          name: line['Sample'],
          gene: line['Gene'],
          group: line['Group'] ? line['Group'] : 'None',
          gRNA_PAM: line['gRNA_PAM'],
          barcode_L: line['Barcode_L'],
          barcode_R: line['Barcode_R'],
        });
      } catch {
        Notify.create({
          message: 'Must contain all required fields',
          color: 'negative',
          icon: 'announcement',
        });
      }
    });
  });
};

const example = () => {
  const workbook = xlsx.utils.book_new();
  workbook.Props = {
    Title: 'CrisprStitch Example',
    Subject: 'Example',
    Author: 'hanys',
  };
  workbook.SheetNames.push('example');
  const wsdata = [
    ['Sample', 'Barcode_L', 'Barcode_R', 'gRNA_PAM', 'Gene', 'Group'],
    [
      'TX-2',
      'TTAGGC',
      'TGACCA',
      'tttgGAGTGAAATCTCTTGTCTTAAGG',
      'OsPDS-site01',
      'pYPQ203-AsCpf1-OsPDS-crRNA01',
    ],
  ];
  workbook.Sheets['example'] = xlsx.utils.aoa_to_sheet(wsdata);
  xlsx.writeFile(workbook, 'crisprstitch_example.xlsx');
};

const toresult = () => {
  if (sampleInfoStore.count === 0) {
    Notify.create({
      message: 'Please input sample info',
      color: 'negative',
      icon: 'announcement',
    });
    return;
  }
  targetPicker.value.readTargetSeq();
  readsPicker.value.readReads();
};
</script>

<style scoped>
.row {
  margin-bottom: 10px;
}
</style>
