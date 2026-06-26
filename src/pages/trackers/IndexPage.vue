<template>
  <div class="dr-trackers">
    <!-- Header -->
    <header class="dr-trackers__head">
      <div>
        <h1 class="dr-trackers__title">Your tags</h1>
        <p class="dr-trackers__sub">
          {{ count === null ? '…' : count }} {{ count === 1 ? 'tag' : 'tags' }} registered
        </p>
      </div>
      <q-btn unelevated color="primary" icon="add" label="New tag" to="/trackers/new" no-caps />
    </header>

    <!-- Search -->
    <q-input
      v-model="search"
      outlined
      dense
      clearable
      debounce="300"
      placeholder="Search tags by name…"
      class="dr-trackers__search"
      bg-color="white"
      @update:model-value="load"
    >
      <template #prepend><q-icon name="search" /></template>
    </q-input>

    <!-- Loading -->
    <div v-if="loading" class="dr-grid">
      <q-card v-for="n in 6" :key="n" flat class="dr-skel">
        <q-skeleton type="QAvatar" size="48px" class="q-mb-md" />
        <q-skeleton type="text" width="60%" />
        <q-skeleton type="text" width="85%" />
      </q-card>
    </div>

    <!-- Empty -->
    <div v-else-if="trackers.length === 0" class="dr-empty">
      <div class="dr-empty__icon"><q-icon name="qr_code_2" size="40px" /></div>
      <h2 class="dr-empty__title">{{ search ? 'No matching tags' : 'No tags yet' }}</h2>
      <p class="dr-empty__text">
        {{
          search
            ? 'Try a different search term.'
            : 'Create your first tag, print the QR, and stick it on anything you want to keep track of.'
        }}
      </p>
      <q-btn
        v-if="!search"
        unelevated
        color="primary"
        icon="add"
        label="Create a tag"
        to="/trackers/new"
        no-caps
      />
    </div>

    <!-- Grid -->
    <div v-else class="dr-grid">
      <TrackerCard
        v-for="t in trackers"
        :key="t.id"
        :tracker="t"
        @open="open"
        @delete="confirmDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TrackerCard, { type Tracker } from 'components/TrackerCard.vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const trackers = ref<Tracker[]>([]);
const count = ref<number | null>(null);
const loading = ref(true);
const search = ref('');

const load = () => {
  loading.value = true;
  const params = { take: 100, sort: 'updated_at', desc: true, q: search.value || undefined };

  api
    .get('/v1/trackers/count', { params })
    .then(({ data }) => {
      count.value = data;
    })
    .catch((err) => console.error(err));

  api
    .get('/v1/trackers', { params })
    .then(({ data }) => {
      trackers.value = data;
    })
    .catch((err) => console.error(err))
    .finally(() => {
      loading.value = false;
    });
};

const open = (id: number) => {
  router.push(`/trackers/${id}`).catch((err) => console.error(err));
};

const confirmDelete = (t: Tracker) => {
  $q.dialog({
    title: 'Delete tag',
    message: `Delete "${t.name || 'this tag'}"? Its QR will stop working.`,
    ok: { label: 'Delete', color: 'negative', unelevated: true },
    cancel: { label: 'Cancel', flat: true },
    persistent: true,
  }).onOk(() => {
    api
      .delete(`/v1/trackers/${t.id}`)
      .then(() => {
        $q.notify({ color: 'positive', message: 'Tag deleted', icon: 'check' });
        load();
      })
      .catch((err) => {
        console.error(err);
        $q.notify({ color: 'negative', message: 'Could not delete tag' });
      });
  });
};

onMounted(load);
</script>

<style scoped lang="scss">
.dr-trackers {
  &__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  &__title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin: 0;
    color: var(--dr-text);
  }

  &__sub {
    margin: 4px 0 0;
    color: var(--dr-muted);
    font-size: 14px;
  }

  &__search {
    max-width: 360px;
    margin-bottom: 22px;
  }
}

.dr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.dr-skel {
  border: 1px solid var(--dr-border);
  border-radius: var(--dr-r-lg);
  padding: 18px;
  background: var(--dr-surface);
}

.dr-empty {
  text-align: center;
  padding: 64px 24px;
  max-width: 420px;
  margin: 0 auto;

  &__icon {
    width: 80px;
    height: 80px;
    border-radius: 24px;
    background: var(--dr-primary-soft);
    color: var(--dr-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
    color: var(--dr-text);
  }

  &__text {
    color: var(--dr-muted);
    font-size: 14.5px;
    line-height: 1.5;
    margin: 0 0 22px;
  }
}
</style>
