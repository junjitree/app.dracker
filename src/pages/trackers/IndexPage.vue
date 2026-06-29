<template>
  <div class="dr-tk">
    <header class="dr-tk__head">
      <div>
        <h1 class="dr-tk__title">Your tags</h1>
        <p class="dr-tk__sub">
          {{ count === null ? '…' : count }} {{ count === 1 ? 'tag' : 'tags' }} registered
        </p>
      </div>
      <q-btn unelevated color="primary" icon="add" label="New tag" no-caps @click="openCreate" />
    </header>

    <div class="dr-tk__layout">
      <!-- LEFT — list -->
      <aside class="dr-tk__list" :class="{ 'dr-tk__pane--mobile-hidden': isMobile && selectedId }">
        <q-input
          v-model="search"
          outlined
          dense
          clearable
          debounce="300"
          placeholder="Search tags…"
          class="dr-tk__search"
          @update:model-value="load"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>

        <div v-if="loading" class="dr-tk__cards">
          <q-card v-for="n in 4" :key="n" flat class="dr-skel">
            <q-skeleton type="QAvatar" size="40px" class="q-mb-sm" />
            <q-skeleton type="text" width="60%" />
            <q-skeleton type="text" width="85%" />
          </q-card>
        </div>

        <div v-else-if="trackers.length === 0" class="dr-empty dr-mesh">
          <div class="dr-empty__icon"><q-icon name="qr_code_2" size="34px" /></div>
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
            no-caps
            @click="openCreate"
          />
        </div>

        <div v-else class="dr-tk__cards">
          <TrackerCard
            v-for="t in trackers"
            :key="t.id"
            :tracker="t"
            :class="{ 'dr-tk__card--active': t.id === selectedId }"
            @open="select"
            @delete="confirmDelete"
          />
        </div>
      </aside>

      <!-- RIGHT — detail -->
      <section
        class="dr-tk__detail"
        :class="{ 'dr-tk__pane--mobile-hidden': isMobile && !selectedId }"
      >
        <!-- nothing selected -->
        <div v-if="!selectedId" class="dr-tk__placeholder dr-mesh">
          <q-icon name="travel_explore" size="46px" class="dr-tk__placeholder-icon" />
          <p>Select a tag to see where it's been pinged.</p>
        </div>

        <!-- detail -->
        <div v-else class="dr-detail">
          <q-inner-loading :showing="detailLoading">
            <q-spinner-gears size="5em" color="primary" />
          </q-inner-loading>

          <template v-if="detail">
            <div class="dr-detail__head">
              <q-btn
                v-if="isMobile"
                flat
                round
                dense
                icon="arrow_back"
                class="dr-detail__back"
                @click="back"
              />
              <div
                class="dr-detail__icon"
                :style="{ background: `${cat.color}26`, color: cat.color }"
              >
                <q-icon :name="cat.icon" size="24px" />
              </div>
              <div class="dr-detail__heading">
                <div class="dr-detail__name">{{ detail.name || 'Untitled tag' }}</div>
                <div class="dr-detail__desc">{{ detail.desc || 'No description' }}</div>
              </div>
              <q-space />
              <q-btn outline color="primary" icon="edit" label="Edit / QR" no-caps @click="openEdit" />
            </div>

            <!-- pings: the payoff -->
            <div v-if="pings.length" class="dr-detail__map-wrap">
              <iframe
                class="dr-detail__map"
                :src="`https://maps.google.com/maps?q=${focused.lat},${focused.lon}&z=15&output=embed`"
                frameborder="0"
                allowfullscreen
              />
              <div class="dr-detail__map-meta">
                <q-icon name="location_on" color="primary" />
                <span class="dr-detail__map-note">{{ focused.note || 'No note left' }}</span>
                <span class="dr-detail__map-time">{{ rel(focused.created_at) }}</span>
              </div>
            </div>

            <div v-else class="dr-detail__noping dr-mesh">
              <q-icon name="my_location" size="32px" class="dr-tk__placeholder-icon" />
              <div class="dr-detail__noping-title">No pings yet</div>
              <p>Print this tag's QR and stick it on your item — finders' locations show up here.</p>
              <q-btn unelevated color="primary" icon="qr_code_2" label="Show QR" no-caps @click="openEdit" />
            </div>

            <!-- earlier pings -->
            <div v-if="pings.length > 1" class="dr-detail__section">
              <div class="dr-detail__section-label">Earlier pings</div>
              <q-list separator>
                <q-item
                  v-for="p in pings"
                  :key="p.id"
                  clickable
                  :active="p.id === focused.id"
                  active-class="dr-detail__ping--active"
                  @click="focusedId = p.id"
                >
                  <q-item-section avatar>
                    <q-icon name="place" :color="p.id === focused.id ? 'primary' : 'grey-5'" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ p.note || 'No note' }}</q-item-label>
                    <q-item-label caption>{{ rel(p.created_at) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- scans: soft signal only -->
            <div class="dr-detail__scans">
              <q-icon name="qr_code_scanner" size="18px" />
              <span v-if="scanCount > 0">
                Scanned {{ scanCount }} time{{ scanCount === 1 ? '' : 's' }}{{
                  lastScan ? ` · last ${rel(lastScan)}` : ''
                }}
              </span>
              <span v-else>Not scanned yet</span>
            </div>
          </template>
        </div>
      </section>
    </div>

    <TrackerDialog v-model="dialog" :tracker-id="dialogId" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import TrackerCard, { type Tracker } from 'components/TrackerCard.vue';
import TrackerDialog from 'components/TrackerDialog.vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { categoryFor } from 'src/composables/category';

interface Scan {
  id: number;
  created_at: string;
}
interface Ping {
  id: number;
  note: string;
  lat: number;
  lon: number;
  created_at: string;
}

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const isMobile = computed(() => $q.screen.lt.md);

// list state
const trackers = ref<Tracker[]>([]);
const count = ref<number | null>(null);
const loading = ref(true);
const search = ref('');

// detail state
const selectedId = computed(() => (route.query.id ? Number(route.query.id) : null));
const detail = ref<Tracker>();
const scans = ref<Scan[]>([]);
const pings = ref<Ping[]>([]);
const detailLoading = ref(false);
const focusedId = ref<number | null>(null);

// dialog state
const dialog = ref(false);
const dialogId = ref<number | null>(null);

const cat = computed(() => categoryFor(detail.value?.name, detail.value?.desc));
const scanCount = computed(() => scans.value.length);
const lastScan = computed(() => scans.value[0]?.created_at ?? null);
const focused = computed<Ping>(
  () => pings.value.find((p) => p.id === focusedId.value) ?? (pings.value[0] as Ping),
);

const rel = (iso: string) => {
  try {
    return `${formatDistanceToNow(parseISO(iso))} ago`;
  } catch {
    return '';
  }
};

const load = () => {
  loading.value = true;
  const params = { take: 100, sort: 'updated_at', desc: true, q: search.value || undefined };

  api
    .get('/v1/trackers/count', { params })
    .then(({ data }) => (count.value = data))
    .catch((err) => console.error(err));

  api
    .get('/v1/trackers', { params })
    .then(({ data }) => {
      trackers.value = data;
      // on desktop, surface the first tag so the detail pane isn't empty
      if (!isMobile.value && selectedId.value === null && data.length) {
        select(data[0].id);
      }
    })
    .catch((err) => console.error(err))
    .finally(() => (loading.value = false));
};

const loadDetail = (id: number) => {
  detailLoading.value = true;
  focusedId.value = null;
  Promise.all([
    api.get(`/v1/trackers/${id}`),
    api.get(`/v1/trackers/${id}/scans`),
    api.get(`/v1/trackers/${id}/pings`),
  ])
    .then(([t, s, p]) => {
      detail.value = t.data;
      scans.value = s.data;
      pings.value = p.data;
    })
    .catch((err) => console.error(err))
    .finally(() => (detailLoading.value = false));
};

const select = (id: number) => {
  router.replace({ query: { ...route.query, id } }).catch((err) => console.error(err));
};
const back = () => {
  const q = { ...route.query };
  delete q.id;
  router.replace({ query: q }).catch((err) => console.error(err));
};

const openCreate = () => {
  dialogId.value = null;
  dialog.value = true;
};
const openEdit = () => {
  dialogId.value = selectedId.value;
  dialog.value = true;
};
const onSaved = (id: number) => {
  load();
  if (selectedId.value === id) {
    loadDetail(id);
  } else {
    select(id);
  }
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
        if (selectedId.value === t.id) back();
        load();
      })
      .catch((err) => {
        console.error(err);
        $q.notify({ color: 'negative', message: 'Could not delete tag' });
      });
  });
};

watch(
  selectedId,
  (id) => {
    if (id === null) {
      detail.value = undefined;
    } else {
      loadDetail(id);
    }
  },
  { immediate: true },
);

onMounted(load);
</script>

<style scoped lang="scss">
.dr-tk {
  &__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 22px;
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

  &__layout {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 22px;
    align-items: start;

    @media (max-width: 1023px) {
      grid-template-columns: 1fr;
    }
  }

  &__search {
    margin-bottom: 14px;
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__card--active {
    outline: 2px solid var(--dr-primary);
    outline-offset: 0;
    border-radius: var(--dr-r-lg);
  }

  &__detail {
    position: relative;
    min-height: 420px;
  }

  &__pane--mobile-hidden {
    display: none;
  }

  &__placeholder {
    height: 100%;
    min-height: 420px;
    border: 1px solid var(--dr-border);
    border-radius: var(--dr-r-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--dr-muted);
    text-align: center;
    padding: 24px;
  }

  &__placeholder-icon {
    color: var(--dr-primary);
    opacity: 0.85;
  }
}

.dr-skel {
  border: 1px solid var(--dr-border);
  border-radius: var(--dr-r-lg);
  padding: 16px;
  background: var(--dr-surface);
}

.dr-empty {
  text-align: center;
  padding: 44px 22px;
  border: 1px solid var(--dr-border);
  border-radius: var(--dr-r-lg);

  &__icon {
    width: 68px;
    height: 68px;
    border-radius: 20px;
    background: var(--dr-primary-soft);
    color: var(--dr-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  &__title {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
    color: var(--dr-text);
  }

  &__text {
    color: var(--dr-muted);
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 18px;
  }
}

.dr-detail {
  position: relative;
  border: 1px solid var(--dr-border);
  border-radius: var(--dr-r-lg);
  background: var(--dr-surface);
  box-shadow: var(--dr-shadow-sm);
  padding: 20px;
  min-height: 420px;

  &__head {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 20px;
  }

  &__back {
    color: var(--dr-muted);
  }

  &__icon {
    width: 46px;
    height: 46px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
  }

  &__heading {
    min-width: 0;
  }

  &__name {
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--dr-text);
  }

  &__desc {
    font-size: 13.5px;
    color: var(--dr-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__map-wrap {
    border-radius: var(--dr-r);
    overflow: hidden;
    border: 1px solid var(--dr-border);
  }

  &__map {
    width: 100%;
    height: 320px;
    display: block;
    border: 0;
  }

  &__map-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    background: var(--dr-surface-2);
  }

  &__map-note {
    font-size: 14px;
    color: var(--dr-text);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__map-time {
    font-size: 12.5px;
    color: var(--dr-faint);
    flex: none;
  }

  &__noping {
    text-align: center;
    padding: 40px 24px;
    border: 1px dashed var(--dr-border);
    border-radius: var(--dr-r);

    p {
      color: var(--dr-muted);
      font-size: 14px;
      line-height: 1.5;
      margin: 6px 0 18px;
      max-width: 360px;
      margin-inline: auto;
    }
  }

  &__noping-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--dr-text);
    margin-top: 6px;
  }

  &__section {
    margin-top: 22px;
  }

  &__section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dr-faint);
    margin-bottom: 4px;
  }

  &__ping--active {
    background: var(--dr-primary-soft);
  }

  &__scans {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 22px;
    padding-top: 16px;
    border-top: 1px solid var(--dr-border);
    color: var(--dr-muted);
    font-size: 13.5px;
  }
}
</style>
