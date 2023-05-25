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
        <q-btn flat color="secondary" @click="xlsx_sample"
          >download example</q-btn
        >
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
        <q-btn
          flat
          color="secondary"
          href="https://github.com/zhangtaolab/CrisprStitch/raw/main/assets/SRR5082532_1.fastq.gz"
          >fastq1</q-btn
        >
        <q-btn
          flat
          color="secondary"
          href="https://github.com/zhangtaolab/CrisprStitch/raw/main/assets/SRR5082532_2.fastq.gz"
          >fastq2</q-btn
        >
        <q-btn flat color="secondary" @click="download_sample"
          >target site</q-btn
        >
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
import * as xlsx from 'xlsx';

const step = ref(1);
const stepper = ref();

function xlsx_sample() {
  const workbook = xlsx.utils.book_new();
  workbook.Props = {
    Title: 'CrisprStitch Example',
    Subject: 'Example',
    Author: 'hanys',
  };
  workbook.SheetNames.push('1');
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
  workbook.Sheets['1'] = xlsx.utils.aoa_to_sheet(wsdata);
  xlsx.writeFile(workbook, 'crisprstitch_example.xlsx');
}

function download_sample() {
  const text =
    '>OsPDS-site01\nctggctgcctgtcatctatgaacataactggaaccagccaagcaagatcttttgcgggacaacttcctactcataggtgcttcgcaagtagcagcatccaagcactgaaaagtagtcagcatgtgagctttgGAGTGAAATCTCTTGTCTTAAGGaataaaggaaaaagattccgtcggaggctcggtgctctacaggttcaacctttgtactctattattgcctcacattccatctcttgtgaaaatatatttgattggcttttctgcaggttgtttgccaggactttccaagacctcc';
  let uriContent = URL.createObjectURL(
    new Blob([text], { type: 'text/plain' })
  );
  const element = document.createElement('a');
  element.setAttribute('href', uriContent);
  element.setAttribute('download', 'target site.fasta');
  element.style.display = 'none';
  element.click();
}
</script>
