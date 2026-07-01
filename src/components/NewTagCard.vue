<template>
  <q-card flat class="dr-new-card">
    <q-card-section class="dr-new-card__body">
      <div class="dr-new-card__icon">
        <q-icon name="add" size="24px" />
      </div>

      <div class="dr-new-card__text">
        <q-input
          v-model="name"
          outlined
          dense
          placeholder="New tag name"
          maxlength="80"
          class="dr-new-card__name"
          :disable="saving"
          @keyup.enter="create"
        />
        <q-input
          v-model="desc"
          outlined
          dense
          placeholder="Description (optional)"
          maxlength="120"
          class="dr-new-card__desc"
          :disable="saving"
          @keyup.enter="create"
        />
      </div>

      <q-btn
        round
        dense
        unelevated
        color="primary"
        icon="check"
        class="dr-new-card__go"
        :loading="saving"
        :disable="!name.trim()"
        @click="create"
      >
        <q-tooltip>Create tag</q-tooltip>
      </q-btn>
    </q-card-section>

    <q-separator class="dr-new-card__sep" />

    <q-card-section class="dr-new-card__foot">
      <q-skeleton type="text" width="46px" />
      <q-skeleton type="text" width="72px" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { api } from 'src/boot/axios';
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const emit = defineEmits<{ created: [number] }>();

const $q = useQuasar();

const name = ref('');
const desc = ref('');
const saving = ref(false);

const create = () => {
  const n = name.value.trim();
  if (!n || saving.value) return;
  saving.value = true;
  api
    .post('/v1/trackers', {
      name: n,
      desc: desc.value.trim(),
      target_url: null,
      is_lost: false,
      message: '',
    })
    .then(({ data: id }) => {
      $q.notify({ color: 'positive', icon: 'check', message: 'Tag created' });
      name.value = '';
      desc.value = '';
      emit('created', id);
    })
    .catch((err) => {
      $q.notify({ color: 'negative', message: err?.response?.data?.msg || 'Could not create tag' });
    })
    .finally(() => {
      saving.value = false;
    });
};
</script>

<style scoped lang="scss">
// Mirrors TrackerCard's chrome so the create card sits in the list as one of
// the family; the + icon and inline inputs mark it as the "add" card, and the
// footer keeps the same slug/time layout with skeletons standing in.
.dr-new-card {
  border: 1px solid var(--dr-border);
  border-radius: var(--dr-r-lg);
  overflow: hidden;
  background: var(--dr-surface);
  box-shadow: var(--dr-shadow-sm);

  &__body {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--dr-primary-soft);
    color: var(--dr-primary);
  }

  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__go {
    flex: none;
    align-self: center;
  }

  // match a tag card's name / desc text sizes
  &__name :deep(input) {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--dr-text);
  }

  &__desc :deep(input) {
    font-size: 13px;
    color: var(--dr-muted);
  }

  &__sep {
    background: var(--dr-border);
  }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
  }
}
</style>
