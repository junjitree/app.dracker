<template>
  <q-card
    flat
    class="dr-tag-card"
    :class="{ 'dr-tag-card--active': active, 'dr-tag-card--new': !isEdit }"
    @click="onCardClick"
  >
    <q-card-section class="dr-tag-card__body">
      <div
        class="dr-tag-card__icon"
        :style="{ background: `${category.color}26`, color: category.color }"
      >
        <q-icon :name="category.icon" size="24px" />
      </div>

      <div class="dr-tag-card__text">
        <!-- NAME -->
        <div v-if="!editingName" class="dr-tag-card__name" @click.stop="editingName = true">
          <span
            class="dr-tag-card__name-text"
            :class="{ 'dr-tag-card__name-text--empty': !name }"
          >
            {{ name || 'Tag name' }}
          </span>
          <q-badge v-if="tracker && tracker.is_lost" color="negative" label="LOST" />
          <q-icon name="edit" size="14px" class="dr-tag-card__edit-hint" />
        </div>
        <q-input
          v-else
          v-model="name"
          dense
          borderless
          autofocus
          placeholder="Tag name"
          maxlength="80"
          class="dr-tag-card__input dr-tag-card__input--name"
          :disable="saving"
          @click.stop
          @keyup.enter="editingName = false"
          @blur="editingName = false"
        />

        <!-- DESCRIPTION -->
        <div v-if="!editingDesc" class="dr-tag-card__desc" @click.stop="editingDesc = true">
          <span
            class="dr-tag-card__desc-text"
            :class="{ 'dr-tag-card__desc-text--empty': !desc }"
          >
            {{ desc || 'Description (optional)' }}
          </span>
          <q-icon name="edit" size="14px" class="dr-tag-card__edit-hint" />
        </div>
        <q-input
          v-else
          v-model="desc"
          dense
          borderless
          autofocus
          placeholder="Description (optional)"
          maxlength="120"
          class="dr-tag-card__input dr-tag-card__input--desc"
          :disable="saving"
          @click.stop
          @keyup.enter="editingDesc = false"
          @blur="editingDesc = false"
        />
      </div>

      <!-- top-right: save when dirty, otherwise a delete button (existing tags only) -->
      <q-btn
        v-if="dirty"
        flat
        round
        dense
        color="primary"
        icon="save"
        class="dr-tag-card__action"
        :loading="saving"
        :disable="!name.trim()"
        @click.stop="save"
      >
        <q-tooltip>Save</q-tooltip>
      </q-btn>
      <q-btn
        v-else-if="isEdit"
        flat
        round
        dense
        icon="delete"
        class="dr-tag-card__action dr-tag-card__delete"
        @click.stop="emitDelete"
      >
        <q-tooltip>Delete</q-tooltip>
      </q-btn>
    </q-card-section>

    <q-separator class="dr-tag-card__sep" />

    <q-card-section class="dr-tag-card__foot">
      <template v-if="isEdit">
        <span class="dr-tag-card__slug">
          <q-icon name="qr_code_2" size="15px" />
          {{ tracker?.slug ?? '—' }}
        </span>
        <span class="dr-tag-card__time">{{ updatedLabel }}</span>
      </template>
      <template v-else>
        <q-skeleton type="text" width="46px" />
        <q-skeleton type="text" width="72px" />
      </template>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { api } from 'src/boot/axios';
import { computed, ref, watch } from 'vue';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { categoryFor } from 'src/composables/category';
import { useQuasar } from 'quasar';

export interface Tracker {
  id: number;
  slug?: string | null;
  name: string;
  desc: string;
  target_url?: string | null;
  is_lost?: boolean;
  message?: string | null;
  created_at: string;
  updated_at: string;
}

// No `tracker` => "new" card (create mode); a `tracker` => existing card (edit mode).
const props = defineProps<{ tracker?: Tracker | null; active?: boolean }>();
const emit = defineEmits<{
  open: [id: number];
  delete: [tracker: Tracker];
  saved: [id: number];
}>();

const $q = useQuasar();

const isEdit = computed(() => props.tracker != null);

const name = ref('');
const desc = ref('');
const editingName = ref(false);
const editingDesc = ref(false);
const saving = ref(false);

// keep the editable copy in sync with the source tag (and reset after a save
// causes the parent to hand back a fresh tracker)
watch(
  () => props.tracker,
  (t) => {
    name.value = t?.name ?? '';
    desc.value = t?.desc ?? '';
    editingName.value = false;
    editingDesc.value = false;
  },
  { immediate: true },
);

const category = computed(() => categoryFor(name.value, desc.value));

const dirty = computed(() => {
  if (!isEdit.value) return !!(name.value.trim() || desc.value.trim());
  return name.value !== (props.tracker?.name ?? '') || desc.value !== (props.tracker?.desc ?? '');
});

const updatedLabel = computed(() => {
  if (!props.tracker) return '';
  try {
    return `${formatDistanceToNow(parseISO(props.tracker.updated_at))} ago`;
  } catch {
    return '';
  }
});

const onCardClick = () => {
  if (props.tracker) emit('open', props.tracker.id);
};
const emitDelete = () => {
  if (props.tracker) emit('delete', props.tracker);
};

const save = () => {
  const n = name.value.trim();
  if (!n || saving.value) return;
  saving.value = true;
  const payload = {
    name: n,
    desc: desc.value.trim(),
    target_url: props.tracker?.target_url ?? null,
    is_lost: props.tracker?.is_lost ?? false,
    message: props.tracker?.message ?? '',
  };
  const req =
    props.tracker != null
      ? api.put(`/v1/trackers/${props.tracker.id}`, payload)
      : api.post('/v1/trackers', payload);

  req
    .then(({ data }) => {
      $q.notify({ color: 'positive', icon: 'check', message: isEdit.value ? 'Tag saved' : 'Tag created' });
      const id = props.tracker != null ? props.tracker.id : (data as number);
      if (!isEdit.value) {
        name.value = '';
        desc.value = '';
      }
      editingName.value = false;
      editingDesc.value = false;
      emit('saved', id);
    })
    .catch((err) => {
      $q.notify({ color: 'negative', message: err?.response?.data?.msg || 'Could not save tag' });
    })
    .finally(() => {
      saving.value = false;
    });
};
</script>

<style scoped lang="scss">
.dr-tag-card {
  border: 1px solid var(--dr-border);
  border-radius: var(--dr-r-lg);
  // Clip the full-bleed separator to the rounded corners so its ends don't
  // ride over the card's outer border.
  overflow: hidden;
  background: var(--dr-surface);
  box-shadow: var(--dr-shadow-sm);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--dr-shadow-lg);
    border-color: transparent;
  }

  // the create card isn't clickable-to-open, so it doesn't lift or use a pointer
  &--new {
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: var(--dr-shadow-sm);
      border-color: var(--dr-border);
    }
  }

  // Active ring drawn as an overlay pseudo-element so it paints *above* the
  // full-bleed separator — a box-shadow ring would be covered by the separator
  // at the edges, making the highlight look clipped at the divider line.
  &--active {
    border-color: transparent;
  }

  &--active::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 2px var(--dr-primary);
    pointer-events: none;
    z-index: 1;
  }

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
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  &__action {
    flex: none;
    align-self: flex-start;
    margin-top: -2px;
  }

  &__delete {
    color: var(--dr-faint);

    &:hover {
      color: var(--dr-negative);
    }
  }

  // NAME — label + pencil, i-beam cursor to hint that clicking edits it
  &__name {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    cursor: text;
  }

  &__name-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--dr-text);
  }

  &__desc {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    margin-top: 1px;
    cursor: text;
  }

  &__desc-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: var(--dr-muted);
  }

  &__name-text--empty,
  &__desc-text--empty {
    color: var(--dr-faint);
  }

  &__edit-hint {
    flex: none;
    color: var(--dr-muted);
  }

  // edit state: strip Quasar's dense-input chrome so the input lines up exactly
  // with the label it replaced
  &__input :deep(.q-field__control),
  &__input :deep(.q-field__control-container),
  &__input :deep(.q-field__native) {
    height: auto;
    min-height: 0;
    padding: 0;
  }

  &__input--name :deep(input) {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.35;
    color: var(--dr-text);
  }

  &__input--desc :deep(input) {
    font-size: 13px;
    line-height: 1.35;
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

  &__slug {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--dr-text);
    font-family: 'Inter', monospace;
  }

  &__time {
    font-size: 12px;
    color: var(--dr-faint);
  }
}
</style>
