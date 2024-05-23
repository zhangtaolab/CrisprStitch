<template>
  <q-table
    title="Samples"
    :rows="props.sampleInfo"
    row-key="name"
    :columns="columns"
    v-model:selected="selected"
    selection="multiple"
    no-data-label="No data"
    v-model:pagination="pagination"
    hide-pagination
  >
    <template v-if="sampleInfo.length > 0" v-slot:top-right>
      <div class="q-gutter-sm">
        <q-btn
          color="secondary"
          icon-right="archive"
          label="Export to csv"
          no-caps
          @click="exportTable"
        />
        <q-btn
          color="secondary"
          icon-right="delete_forever"
          label="Delete selected"
          no-caps
          @click="deleteSelected"
        />
      </div>
    </template>
    <template v-slot:no-data="{ message }">
      <div class="full-width row flex-center q-gutter-sm">
        <span>{{ message }}</span>
      </div>
    </template>
  </q-table>
  <div class="row justify-center q-mt-md">
    <q-pagination
      v-model="pagination.page"
      color="grey-8"
      :max="pagesNumber"
      size="sm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Sample } from '../../stores/interface';
import { Notify, exportFile } from 'quasar';
import { useSampleInfoStore } from 'src/stores/sampleinfo';

const props = defineProps({
  sampleInfo: {
    type: Array<Sample>,
    required: true,
  },
});

const selected = ref<Sample[]>([]);
const pagination = ref({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 5,
});
const pagesNumber = computed(() =>
  Math.ceil(props.sampleInfo.length / pagination.value.rowsPerPage)
);

interface Column {
  name: string;
  label: string;
  field: string | ((row: any) => any);
  align: 'left' | 'right' | 'center';
  sortable: boolean;
  format?: (val: any, row: any) => any;
}

const columns: Column[] = [
  {
    name: 'name',
    label: 'Sample',
    field: (row: any) => row.name,
    format: (val: any) => `${val}`,
    align: 'left',
    sortable: true,
  },
  {
    name: 'gene',
    label: 'Gene',
    field: 'gene',
    align: 'left',
    sortable: true,
  },
  {
    name: 'gRNA_PAM',
    label: 'gRNA_PAM',
    field: 'gRNA_PAM',
    align: 'left',
    sortable: true,
  },
  {
    name: 'barcode_L',
    label: 'barcode_L',
    field: 'barcode_L',
    align: 'left',
    sortable: true,
  },
  {
    name: 'barcode_R',
    label: 'barcode_R',
    field: 'barcode_R',
    align: 'left',
    sortable: true,
  },
  {
    name: 'group',
    label: 'Group',
    field: 'group',
    align: 'left',
    sortable: true,
  },
];

const exportTable = () => {
  function wrapCsvValue(
    val: string,
    formatFn?: ((val: any, row: any) => any) | undefined,
    row?:
      | {
          name: string;
          gene: string;
          gRNA_PAM: string;
          barcode_L: string;
          barcode_R: string;
          group: string | undefined;
        }
      | undefined
  ) {
    let formatted = formatFn !== void 0 ? formatFn(val, row) : val;

    formatted =
      formatted === void 0 || formatted === null ? '' : String(formatted);

    formatted = formatted.split('"').join('""');
    /**
     * Excel accepts \n and \r in strings, but some other CSV parsers do not
     * Uncomment the next two lines to escape new lines
     */
    // .split('\n').join('\\n')
    // .split('\r').join('\\r')

    return `"${formatted}"`;
  }
  // naive encoding to csv format
  const content = [columns.map((col) => wrapCsvValue(col.label))]
    .concat(
      props.sampleInfo.map((row) =>
        columns
          .map((col) =>
            wrapCsvValue(
              typeof col.field === 'function'
                ? col.field(row)
                : (row as unknown as { [key: string]: string })[
                    col.field === void 0 ? col.name : col.field
                  ],
              col.format,
              row
            )
          )
          .join(',')
      )
    )
    .join('\r\n');

  const status = exportFile('table-export.csv', content, 'text/csv');

  if (status !== true) {
    Notify.create({
      message: 'Browser denied file download...',
      color: 'negative',
      icon: 'warning',
    });
  }
};

const deleteSelected = () => {
  selected.value.filter(function (item) {
    useSampleInfoStore().removeSample(item);
    return item;
  });
  selected.value = [];
};
</script>
