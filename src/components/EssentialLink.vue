<template>
  <q-item
    v-ripple
    clickable
    tag="a"
    :to="link"
    class="dr-nav-item q-my-xs"
    active-class="dr-nav-item--active"
  >
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" size="22px" />
    </q-item-section>

    <q-item-section>
      <q-item-label class="text-weight-medium">{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
export interface EssentialLinkProps {
  title: string;
  caption?: string;
  link?: string;
  icon?: string;
}

withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  link: '#',
  icon: '',
});
</script>

<style scoped lang="scss">
.dr-nav-item {
  border-radius: var(--dr-r-sm);
  margin-inline: 8px;
  color: var(--dr-muted);
  transition:
    background 0.15s ease,
    color 0.15s ease;

  :deep(.q-item__label--caption) {
    color: var(--dr-faint);
  }

  &:hover {
    background: var(--dr-surface-2);
    color: var(--dr-text);
  }
}

.dr-nav-item--active {
  background: var(--dr-primary-soft);
  color: var(--dr-primary);

  :deep(.q-icon),
  :deep(.q-item__label) {
    color: var(--dr-primary);
  }
}
</style>
