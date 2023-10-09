<template>
  <div class="q-pa-md">
    <q-stepper v-model="step" ref="stepper" color="primary" animated>
      <q-step
        :name="1"
        title="Input Sample information"
        icon="settings"
        :done="step > 1"
      >
        <div class="row q-gutter-md justify-center">
          <div class="col-6">
            <img
              style="width: 100%"
              class="image"
              src="../assets/img/step1.gif"
            />
          </div>
          <div class="col-5">
            <h6>1.1 Import sample information separately or by a file.</h6>
            <p>
              Simply input prepared sample information. Group can be left if
              there is no replication. In this case, group name will be filled
              with sample name. Remember to add sample after filling the form. A
              formatted excel can be read by CrisprStitch to automatically
              import sample information.
            </p>
            <q-btn flat color="secondary" @click="xlsx_sample"
              >download example</q-btn
            >
            <h6>
              1.2 Check and config sample information in the reactive table.
            </h6>
          </div>
        </div>
      </q-step>

      <q-step
        :name="2"
        title="Input sequenceing data"
        caption="Optional"
        icon="create_new_folder"
        :done="step > 2"
      >
        <div class="row q-gutter-md justify-center">
          <div class="col-6">
            <img
              style="width: 100%"
              class="image"
              src="../assets/img/step2.gif"
            />
          </div>
          <div class="col-5">
            <h6>2 Import FASTQ files and target site sequences.</h6>
            <p>
              Paired-end fastq files can be uploaded in one file input.
              Otherwise upload a single file if merging is not needed, in which
              case merging step will be skipped.
            </p>
            <p>
              Examples of sequencing files in fastq and target site file in
              fasta are as follows.
            </p>
            <q-btn
              flat
              color="secondary"
              href="https://bioinfor.yzu.edu.cn/download/crisprstitch/SRR5082532_1.fastq.gz"
              >fastq1</q-btn
            >
            <q-btn
              flat
              color="secondary"
              href="https://bioinfor.yzu.edu.cn/download/crisprstitch/SRR5082532_2.fastq.gz"
              >fastq2</q-btn
            >
            <q-btn flat color="secondary" @click="download_sample"
              >target site</q-btn
            >
          </div>
        </div>
      </q-step>

      <q-step :name="3" title="Get result" icon="assignment">
        <div class="row q-gutter-md justify-center">
          <div class="col-6">
            <img
              style="width: 100%"
              class="image"
              src="../assets/img/step3.gif"
            />
          </div>
          <div class="col-5">
            <h6>3.1 The first part is a summary table.</h6>
            <p>
              The first part is a summary table of all samples, which can also
              be exported to csv.
            </p>
            <h6>3.2 Downloadable charts for each group are provided.</h6>
            <p>
              The second part is a downloadable chart for each group, showing
              genome-editing outcomes within the target region. Deletion,
              insertion and substitution are included. All charts can be saved
              as PDFs for further editing. Alignment results can be exported as
              text files.
            </p>
          </div>
        </div>
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
          <q-btn
            href="https://bioinfor.yzu.edu.cn/software/crisprstitch"
            color="primary"
            v-if="step === 3"
            label="Video tutorial"
            target="_blank"
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
