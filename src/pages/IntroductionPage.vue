<template>
  <div class="main" style="text-align: center">
    <img src="../assets/img/2023-05-2211.44.36.png" style="width: 100%" />
    <div class="row justify-center">
      <q-btn
        color="primary"
        to="/input"
        label="start"
        size="xl"
        icon="directions"
        flat
      />
    </div>
    <br />
    <div style="text-align: left">
      <!-- <h4>CrisprStitch: fast evaluate the efficiency of CRISPR-Cas systems</h4> -->
      <div class="row q-gutter-md justify-center">
        <q-card class="my-card col-lg-4 col-auto col-md-8 col-xs-10">
          <img src="../assets/img/stitching.jpeg" />

          <q-card-section>
            <div class="text-h6">Purpose</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            CrisprStitch processes the high-throughput genome-editing data of
            CRISPR nuclease transformed protoplasts with integrated analysis
            steps, including mapping reads and normalizing reads count,
            calculating mutation frequency (deletion and insertion), evaluating
            efficiency and accuracy of genome-editing, and visualizing the
            results (tables and histograms).
          </q-card-section>
        </q-card>
        <q-card class="my-card col-lg-4 col-auto col-md-8 col-xs-10">
          <img src="../assets/img/2023-05-2200.08.08.png" />
          <img src="../assets/img/2022-11-0209.20.22.png" />
          <q-card-section>
            <div class="text-h6">Result</div>
          </q-card-section>
          <q-card-section>
            After data processing, the application provides an overview of
            different mutation results in tables and plots. Deletion, deletion
            size, insertion, insertion size, and substitution are included.
          </q-card-section>
        </q-card>
        <q-card class="my-card col-lg-3 col-auto col-md-8 col-xs-10">
          <q-card-section>
            <div class="text-h6">Requirements</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <p>
              1.Sample information: sample name, target gene, group name, gRNA
              sequence, barcodes.
            </p>
            <p>2.Sequencing data in Fastq.</p>
            <p>3.Target gene sequence in Fasta.</p>
          </q-card-section>
          <q-card-section>
            <div class="text-h6">Contact</div>
          </q-card-section>
          <q-card-section>
            <q-btn
              flat
              color="secondary"
              href="mailto:hanyangshuo@zhangtaolab.org"
              >hanyangshuo@zhangtaolab.org</q-btn
            >
          </q-card-section>
          <q-card-section>
            <div class="text-h6">Citation</div>
            Han YS†, Liu GQ†, Wu YC, Bao Y, Zhang Y*, Zhang T*.
            <a href="https://doi.org/10.1016/j.xplc.2023.100783"
              >CrisprStitch: Fast evaluation of the efficiency of CRISPR editing
              systems.</a
            >
            Plant Communications DOI: https://doi.org/10.1016/j.xplc.2023.100783
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>
