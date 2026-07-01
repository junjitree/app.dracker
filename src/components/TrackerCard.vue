<template>
  <q-card
    flat
    class="dr-tag-card"
    :class="{ 'dr-tag-card--active': active }"
    @click="$emit('open', tracker.id)"
  >
    <q-card-section class="dr-tag-card__body">
      <div
        class="dr-tag-card__icon"
        :style="{
          background: `${category.color}26`,
          color: category.color,
        }"
      >
        <q-icon :name="category.icon" size="24px" />
      </div>

      <div class="dr-tag-card__text">
        <div class="dr-tag-card__name">
          <span class="dr-tag-card__name-text">{{ tracker.name || 'Untitled tag' }}</span>
          <q-badge v-if="tracker.is_lost" color="negative" label="LOST" />
        </div>
        <div class="dr-tag-card__desc">{{ tracker.desc || 'No description' }}</div>
      </div>

      <q-btn flat round dense icon="more_horiz" class="dr-tag-card__menu" @click.stop>
        <q-menu anchor="bottom right" self="top right" :offset="[0, 4]">
          <q-list dense style="min-width: 140px">
            <q-item v-close-popup clickable @click="$emit('open', tracker.id)">
              <q-item-section avatar><q-icon name="edit" size="18px" /></q-item-section>
              <q-item-section>Edit</q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="$emit('delete', tracker)">
              <q-item-section avatar
                ><q-icon name="delete" size="18px" color="negative"
              /></q-item-section>
              <q-item-section class="text-negative">Delete</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-card-section>

    <q-separator class="dr-tag-card__sep" />

    <q-card-section class="dr-tag-card__foot">
      <span class="dr-tag-card__slug">
        <q-icon name="qr_code_2" size="15px" />
        {{ tracker.slug ?? '—' }}
      </span>
      <span class="dr-tag-card__time">{{ updatedLabel }}</span>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { categoryFor } from 'src/composables/category';

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

const props = defineProps<{ tracker: Tracker; active?: boolean }>();
defineEmits<{ open: [id: number]; delete: [tracker: Tracker] }>();

const category = computed(() => categoryFor(props.tracker.name, props.tracker.desc));

const updatedLabel = computed(() => {
  try {
    return `${formatDistanceToNow(parseISO(props.tracker.updated_at))} ago`;
  } catch {
    return '';
  }
});
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

  // Inset ring, drawn inside the card so the list's overflow can't clip it.
  // !important is needed to beat Quasar's `.q-card--flat { box-shadow: none !important }`.
  &--active {
    border-color: transparent;
    box-shadow: inset 0 0 0 2px var(--dr-primary) !important;
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

  &__menu {
    flex: none;
    align-self: flex-start;
    margin-top: -2px;
    color: var(--dr-faint);
  }

  &__name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--dr-text);
  }

  &__name-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__desc {
    margin-top: 1px;
    font-size: 13px;
    color: var(--dr-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
