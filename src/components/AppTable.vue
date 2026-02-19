<template>
  <q-table
    ref="tableRef"
    v-model:pagination="paging"
    v-bind="$attrs"
    :rows="rows"
    :columns="columns"
    :loading="loading"
    :filter="filter"
    :row-key="rowKey"
    color="primary"
    flat
    bordered
    :style="{ maxHeight: 'calc(100vh - 80px)' }"
    @request="onRequest"
  >
    <template #top-left>
      <div class="row q-gutter-md q-mb-md">
        <q-btn icon="refresh" outline :disable="loading" @click="request" />
        <div class="flex items-center">{{ title }}</div>
      </div>
    </template>

    <template #top-right>
      <div class="row q-gutter-md q-mb-md">
        <slot name="actions" v-bind="props" />

        <AppSelect
          v-model="paging.rowsPerPage"
          label="Limit"
          :options="[10, 20, 50, 100]"
          dense
          outlined
          @update:model-value="request"
        />

        <q-input
          v-if="!noFilter"
          v-model="filter"
          :debounce="300"
          placeholder="Search"
          outlined
          dense
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-btn
          v-if="!noExport"
          icon="dataset_linked"
          label="Export"
          color="primary"
          outline
          @click="showExportDialog = true"
        />
      </div>
    </template>

    <template #body-cell-email="{ col, row }">
      <q-td :class="`text-${col.align}`">
        <div>{{ row.email }}</div>
        <slot name="email-extra" v-bind="{ col, row }" />
      </q-td>
    </template>

    <template #bottom>
      <div class="flex justify-between full-width">
        <slot name="bottom-left">
          <div v-if="rows.length > 0" class="flex flex-center">
            {{ (paging.page - 1) * paging.rowsPerPage + 1 }} -
            {{ (paging.page - 1) * paging.rowsPerPage + rows.length }} of
            {{ Intl.NumberFormat().format(paging.rowsNumber) }}
          </div>
        </slot>

        <slot name="bottom-right">
          <slot name="pagination">
            <q-pagination
              v-model="paging.page"
              :max="Math.ceil(paging.rowsNumber / paging.rowsPerPage)"
              color="text-normal"
              input
              @update:model-value="request"
            />
          </slot>
        </slot>
      </div>
    </template>

    <template #no-data>
      <div v-if="!loading" class="col flex flex-center text-h4 text-center text-primary q-my-xl">
        No Results
      </div>
    </template>

    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
  </q-table>

  <q-dialog v-model="showExportDialog">
    <q-card>
      <q-form class="q-gutter-xl" :disable="exporting" @submit="exportData">
        <div class="row">
          <q-card-section class="text-h4 col-12"> Export "{{ title }}" Data </q-card-section>

          <div class="col-12">
            <q-field
              v-model="exportColumns"
              class="q-ma-md"
              lazy-rules
              :rules="[(val) => val.length > 0 || 'Please select at least one column.']"
              filled
            >
              <template #control>
                <div class="q-gutter-md">
                  <q-checkbox
                    v-for="col in exportableColumns"
                    :key="col.name"
                    v-model="exportColumns"
                    :val="col.name"
                    :label="col.label"
                  />
                </div>
              </template>

              <template #prepend>
                <q-btn flat dense icon="help" color="blue">
                  <q-menu>
                    <div class="q-pa-md" style="min-width: 250px; max-width: 800px">
                      <q-card-section class="text-h4 col-12">ISO 8601 Date Format</q-card-section>
                      <q-card-section class="text col-12">
                        <p>
                          The date and time format <code>1970-01-01T13:30:15Z</code> is known as the
                          <strong>ISO 8601</strong> standard.
                        </p>
                        <ul>
                          <li>
                            <strong><code>YYYY-MM-DD</code></strong> This is the date part, for
                            example, <code>1970-01-01</code>.
                          </li>
                          <li>
                            <strong><code>T</code></strong>
                            A separator that indicates the beginning of the time section.
                          </li>
                          <li>
                            <strong><code>HH:mm:ss</code></strong> The time, formatted as hours
                            (24), minutes, and seconds (e.g., <code>13:30:15</code>).
                          </li>
                          <li>
                            <strong><code>Z</code></strong> The timezone indicator. The letter
                            <strong>Z</strong> stands for "Zulu time," which is another name for
                            <strong>UTC</strong> (Coordinated Universal Time). This signifies that
                            the time has a zero-hour offset from UTC.
                          </li>
                        </ul>
                      </q-card-section>
                    </div>
                  </q-menu>
                </q-btn>
              </template>
            </q-field>
          </div>

          <div class="col-12 q-pa-md">
            <q-btn
              :disable="exporting"
              label="Export"
              size="lg"
              type="submit"
              color="primary"
              class="full-width"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { type QTableProps, type QTableColumn, useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { format, parseISO } from 'date-fns';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface Field {
  col: string;
  name: string;
}

interface Props {
  endpoint: string;
  rowKey?: string;
  sort?: string;
  desc?: boolean;
  // eslint-disable-next-line vue/require-default-prop
  title?: string;
  // eslint-disable-next-line vue/require-default-prop
  columns?: QTableProps['columns'];
  trigger?: number;
  noFilter?: boolean;
  noExport?: boolean;
  loadManually?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: any;
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  sort: 'updated_at',
  desc: true,
  trigger: 0,
  noFilter: false,
  noExport: true,
  loadManually: false,
  query: () => {
    return {};
  },
});

const timestamps = ['created_at', 'deleted_at', 'expiration_date', 'streamed_at', 'updated_at'];
const $q = useQuasar();
const router = useRouter();
const route = useRoute();

const parts = props.endpoint.split('/');
const qprefix = parts[parts.length - 1] || 'queer';
const showExportDialog = ref(false);
const exportColumns = ref<string[]>([]);
const exportableColumns = computed(() => {
  return props.columns?.filter((col) => col.name != '' && col.label != '' && col.name != 'actions');
});

const tableRef = ref();
const rows = ref([]);
const loading = ref(true);
const exporting = ref(false);
const filter = ref(route.query[`${qprefix}_q`]?.toString());

const firstLoad = ref(true);

const paging = ref({
  sortBy: route.query[`${qprefix}_sort`]?.toString() || props.sort,
  descending: route.query[`${qprefix}_desc`]
    ? route.query[`${qprefix}_desc`] == 'true'
    : props.desc,
  page: parseInt(route.query[`${qprefix}_page`]?.toString() || '1'),
  rowsPerPage: parseInt(route.query[`${qprefix}_rowsPerPage`]?.toString() || '20'),
  rowsNumber: 0,
});

watch(
  () => props.trigger,
  () => {
    tableRef.value.requestServerInteraction();
  },
);

onMounted(() => {
  props.columns?.map((row: QTableColumn) => {
    if (row.name != '' && row.label != '' && row.name != 'actions') {
      exportColumns.value.push(row.name);
    }

    if ((row.name == 'id' || row.name.includes('_id')) && !row.sortOrder) {
      row.sortOrder = 'da';
    }

    if (timestamps.includes(row.name) && !row.format) {
      row.sortOrder = 'da';
      row.format = (field) => {
        if (!field) {
          return '';
        }

        const date = parseISO(field);
        return format(date, 'yyyy-MM-dd hh:mm:ss aa');
      };
    }

    return row;
  });

  if (props.loadManually) {
    return;
  }

  tableRef.value.requestServerInteraction();
});

const request = () => {
  tableRef.value.requestServerInteraction();
};

const exportData = () => {
  const { page, rowsPerPage, sortBy, descending } = paging.value;
  const sort = sortBy;
  const skip = (page - 1) * rowsPerPage;
  const take = rowsPerPage;
  const desc = descending;
  const params = { skip, take, q: filter.value, sort, desc, ...props.query };
  const fields: Field[] = [];
  props.columns?.map((row: QTableColumn) => {
    if (row.name == '' || row.label == '' || !exportColumns.value.includes(row.name)) {
      return;
    }
    fields.push({ col: row.name, name: row.label });
  });

  exporting.value = true;

  api
    .post(`${props.endpoint}/export`, fields, { params })
    .then(() => {
      //
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      exporting.value = false;
      showExportDialog.value = false;
      $q.dialog({
        color: 'positive',
        title: 'Export Queued',
        message: 'Please check the Exports page to see the progress',
        ok: 'Ok',
        persistent: true,
      });
    });
};

const onRequest: QTableProps['onRequest'] = ({ pagination, filter }) => {
  loading.value = true;
  const { page, rowsPerPage, sortBy, descending } = pagination;
  const sort = sortBy;
  const skip = (page - 1) * rowsPerPage;
  const take = rowsPerPage;
  const desc = descending;

  paging.value.sortBy = sortBy;
  paging.value.descending = descending;

  const query = {
    ...route.query,
    ...props.query,
    [`${qprefix}_page`]: page,
    [`${qprefix}_take`]: take,
    [`${qprefix}_q`]: filter,
    [`${qprefix}_sort`]: sort,
    [`${qprefix}_desc`]: desc.toString(),
  };

  if (firstLoad.value) {
    router.replace({ path: route.path, query }).catch(() => {});
    firstLoad.value = false;
  } else {
    router.push({ path: route.path, query }).catch(() => {});
  }

  const params = { skip, take, q: filter, sort, desc, ...props.query };

  api
    .get(`${props.endpoint}/count`, { params })
    .then(({ data }) => {
      paging.value.page = page;
      paging.value.rowsPerPage = rowsPerPage;
      paging.value.rowsNumber = data;
    })
    .catch((err) => {
      console.error(err);
    });

  api
    .get(props.endpoint, { params })
    .then(({ data }) => {
      rows.value = data;
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>

<style lang="scss">
.q-table {
  thead {
    position: sticky;
    top: 0;
    z-index: 2;
    background: $grey-1;
  }

  tr th {
    background: $grey-1;
    z-index: 0;
  }

  tr th:first-child,
  tr td:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: $grey-1;
  }
}

.q-dark .q-table {
  thead {
    background: var(--q-dark);

    tr th {
      background: var(--q-dark);
    }
  }

  tr th:first-child,
  tr td:first-child {
    background: var(--q-dark);
  }
}
</style>
