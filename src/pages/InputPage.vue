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
          { slot: 'one', value: 'one' },
          { slot: 'two', value: 'two' },
          { slot: 'three', value: 'three' },
        ]"
      >
        <template v-slot:one>
          <q-icon name="list" />
          <q-space />
          <q-item-label>{{
            $q.screen.gt.xs ? 'Separately' : void 0
          }}</q-item-label>
        </template>
        <template v-slot:two>
          <q-icon name="file_upload" />
          <q-space />
          <q-item-label>{{
            $q.screen.gt.xs ? 'By file' : void 0
          }}</q-item-label>
        </template>
        <template v-slot:three>
          <q-icon name="grid_on" />
          <q-space />
          <q-item-label>{{
            $q.screen.gt.xs ? '96 well plate' : void 0
          }}</q-item-label>
        </template>
      </q-btn-toggle>
    </div>
  </div>
  <div class="row justify-center">
    <q-card class="col-12 col-md-10 col-xl-6">
      <q-card-section class="bg-blue-grey text-white">
        <div class="text-h6">Sample Information</div>
      </q-card-section>
      <q-card-section>
        <sample-form v-if="inputMode === 'one'" />
        <div class="row justify-center" v-if="inputMode === 'two'">
          <file-picker
            ref="sampleInput"
            class="col-10 col-md-5"
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
      <q-card-section class="bg-blue-grey text-white">
        <div class="text-h6">Reads and target region sequences</div>
        <div class="text-subtitle2">
          reads can be pre-merged or paired-end files to merge.
          <q-icon name="help">
            <q-tooltip>
              <div class="text-subtitle2">
                Select both ends of fastq files in the first file input to merge
                them. Merging will be skipped if only one file is selected.
              </div>
            </q-tooltip>
          </q-icon>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row q-gutter-md justify-center">
          <file-picker
            ref="readsPicker"
            class="col-10 col-md-5"
            hint="fastq"
            label="Reads"
            :max_files="2"
            accept=".fq, .fastq, .fq.gz, .fastq.gz"
          />
          <file-picker
            ref="targetPicker"
            class="col-10 col-md-5"
            hint="fasta"
            label="Target region"
            accept=".fa, .fasta, .fa.gz, .fasta.gz"
          />
        </div>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn
          flat
          color="primary"
          @click="toresult()"
          label="Confirm"
          size="large"
          icon="done_outline"
          to="/result"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import FilePicker from '../components/FilePicker.vue';
import WellPlate from 'src/components/sampleInfo/WellPlate.vue';
import SampleForm from 'src/components/sampleInfo/SampleForm.vue';
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
