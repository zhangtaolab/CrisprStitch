<template>
  <q-table
    title="Summary"
    :rows="props.table"
    row-key="name"
    :columns="columns"
    no-data-label="No data"
    v-model:pagination="pagination"
    hide-pagination
  >
    <template v-if="table.length > 0" v-slot:top-right>
      <div class="q-gutter-sm">
        <q-btn
          color="secondary"
          icon-right="archive"
          label="Export"
          no-caps
          @click="exportTable"
        />
      </div>
    </template>
    <template v-slot:no-data="{ message }">
      <div class="full-width row flex-center q-gutter-sm">
        <span>{{ message }}</span>
      </div>
    </template>
  </q-table>
</template>

<script setup lang="ts">
import { Notify, exportFile } from 'quasar';
import { ref } from 'vue';
const props = defineProps({
  table: {
    type: Array,
    required: true,
  },
});

const pagination = ref({
  sortBy: 'desc',
  descending: false,
  page: 1,
  rowsPerPage: 5,
});

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
    name: 'Sample',
    label: 'Sample',
    field: (row: any) => row.Sample,
    format: (val: any) => `${val}`,
    align: 'left',
    sortable: true,
  },
  {
    name: 'mutation',
    label: 'mutation(%)',
    field: 'mutation',
    align: 'left',
    sortable: true,
  },
  {
    name: 'substitution',
    label: 'substitution(%)',
    field: 'substitution',
    align: 'left',
    sortable: true,
  },
  {
    name: 'insertion only',
    label: 'insertion only(%)',
    field: 'insertion only',
    align: 'left',
    sortable: true,
  },
  {
    name: 'deletion only',
    label: 'deletion only(%)',
    field: 'deletion only',
    align: 'left',
    sortable: true,
  },
  {
    name: 'insertion&deletion',
    label: 'insertion&deletion',
    field: 'insertion&deletion',
    align: 'left',
    sortable: true,
  },
  {
    name: 'mutation count',
    label: 'mutation count',
    field: 'mutation count',
    align: 'left',
    sortable: true,
  },
  {
    name: 'substitution count',
    label: 'substitution count',
    field: 'substitution count',
    align: 'left',
    sortable: true,
  },
  {
    name: 'insertion only count',
    label: 'insertion only count',
    field: 'insertion only count',
    align: 'left',
    sortable: true,
  },
  {
    name: 'deletion only count',
    label: 'deletion only count',
    field: 'deletion only count',
    align: 'left',
    sortable: true,
  },
  {
    name: 'insertion&deletion count',
    label: 'insertion&deletion count',
    field: 'insertion&deletion count',
    align: 'left',
    sortable: true,
  },
  {
    name: 'total read count',
    label: 'total read count',
    field: 'total read count',
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
      props.table.map((row) =>
        columns
          .map((col) =>
            wrapCsvValue(
              typeof col.field === 'function'
                ? col.field(row)
                : (row as unknown as { [key: string]: string })[
                    col.field === void 0 ? col.name : col.field
                  ],
              col.format,
              row as any
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
</script>
