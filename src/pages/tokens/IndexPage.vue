<template>
  <AppTable :columns="columns" :trigger="trigger" title="Sessions" endpoint="v1/tokens" no-export>
    <template #actions>
      <q-btn
        icon="logout"
        label="Logout Other Sessions"
        color="primary"
        outline
        @click="logoutSessions"
      />
    </template>

    <template #body-cell-actions="{ col, row }">
      <q-td :class="`text-${col.align}`">
        <q-badge v-if="row.current" color="green">current</q-badge>
        <q-btn v-else color="red" dense flat @click.stop="logoutSession(row.id)">
          <q-icon name="logout" />
          <q-tooltip anchor="bottom middle" self="top middle">Logout</q-tooltip>
        </q-btn>
      </q-td>
    </template>
  </AppTable>
</template>

<script setup lang="ts">
import { api } from 'boot/axios';
import { ref } from 'vue';
import { type QTableColumn, useQuasar } from 'quasar';

const $q = useQuasar();
const trigger = ref(0);

const logoutSession = (id: number) => {
  $q.dialog({
    title: 'Sure?',
    message: 'Logout session',
    ok: 'Confirm',
    cancel: 'Cancel',
    persistent: true,
  }).onOk(() => {
    api
      .delete(`/v1/tokens/${id}`)
      .then(() => {
        trigger.value++;
      })
      .catch((err) => {
        console.error(err);
      });
  });
};

const logoutSessions = () => {
  $q.dialog({
    title: 'Sure?',
    message: 'Logout ALL other sessions?',
    ok: 'Confirm',
    cancel: 'Cancel',
    persistent: true,
  }).onOk(() => {
    $q.dialog({
      title: 'Really Sure?',
      message: 'Are you "FUCKIN SURE" Logout ALL other sessions?',
      ok: 'Confirm',
      cancel: 'Cancel',
      persistent: true,
    }).onOk(() => {
      api
        .delete(`/v1/tokens`)
        .then(() => {
          trigger.value++;
        })
        .catch((err) => {
          console.error(err);
        });
    });
  });
};

const columns: QTableColumn[] = [
  {
    name: 'id',
    field: 'id',
    label: 'ID',
    align: 'right',
  },
  {
    name: 'agent',
    field: 'agent',
    label: 'User Agent',
    align: 'left',
  },
  {
    name: 'created_at',
    field: 'created_at',
    label: 'Login Date',
    sortable: true,
  },
  {
    name: 'updated_at',
    field: 'updated_at',
    label: 'Last Used',
    sortable: true,
  },
  {
    name: 'actions',
    field: 'actions',
    label: 'Actions',
  },
];
</script>
