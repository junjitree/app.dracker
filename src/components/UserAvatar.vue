<template>
  <img
    v-if="email != ''"
    :class="`gravatar ${props.class}`"
    :src="`https://www.gravatar.com/avatar/${md5(email)}?d=identicon&size=${size}&`"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
</template>

<script setup lang="ts">
import md5 from 'md5';

interface Props {
  email?: string;
  class?: string;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  email: '',
  class: '',
  size: 40,
});
</script>
