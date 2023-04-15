<template>
  <div class="text-h4">
    CrisprStitch: fast evaluate the efficiency of CRISPR-Cas systems
  </div>
  <!-- result picture here -->
  <!-- chat formatted feature description -->
  <!-- article abstract -->
  <!-- requirements -->
  <!-- support information -->
  <div style="text-align: left">
    <!-- <h4>CrisprStitch: fast evaluate the efficiency of CRISPR-Cas systems</h4> -->
    <h5>Purpose</h5>
    <p>
      CrisprStitch processes the high-throughput genome-editing data of CRISPR
      nuclease transformed protoplasts with integrated analysis steps, including
      mapping reads and normalizing reads count, calculating mutation frequency
      (deletion and insertion), evaluating efficiency and accuracy of
      genome-editing, and visualizing the results (tables and histograms).
    </p>
    <h5>Requirements</h5>
    <p>
      1.Sample information: sample name, target gene, group name, gRNA sequence,
      barcodes.
    </p>
    <p>2.Sequencing data in Fastq.</p>
    <p>3.Target gene sequence in Fasta.</p>
    <div class="row justify-center">
      <q-btn
        color="primary"
        to="/input"
        label="start"
        size="large"
        icon="directions"
      />
    </div>
    <h5>A graphical result example:</h5>
    <img src="../assets/img/2022-09-1212.10.10.png" style="width: 80%" />
    <p>Developed by hanyangshuo@zhangtaolab.org</p>
  </div>
</template>
