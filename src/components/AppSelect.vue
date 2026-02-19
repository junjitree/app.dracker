<template>
  <q-select
    ref="selectRef"
    v-model="model"
    v-bind="$attrs"
    :options="optionsFiltered"
    :label="label"
    :option-label="optionLabel"
    :option-value="optionValue"
    :input-debounce="0"
    :hide-selected="hideSelected"
    :use-input="useInput"
    :fill-input="fillInput"
    @popup-show="popupShow"
    @filter="filter"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { QSelect } from 'quasar'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OptionType = any

const props = defineProps({
  modelValue: {
    type: [String, Number, Object],
    default: null,
  },
  options: {
    type: Array as () => OptionType[],
    required: true,
  },
  label: {
    type: String,
    default: 'Option',
  },
  optionLabel: {
    type: String,
    default: undefined,
  },
  optionValue: {
    type: String,
    default: undefined,
  },
  hideSelected: {
    type: Boolean,
    default: true,
  },
  useInput: {
    type: Boolean,
    default: true,
  },
  fillInput: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const optionsFiltered = ref<OptionType[]>([])
const selectRef = ref<QSelect | null>(null)
const afterEnter = ref(false)

watch(
  () => props.options,
  (newOptions) => {
    optionsFiltered.value = newOptions
  },
  { immediate: true },
)

const popupShow = () => {
  if (afterEnter.value) {
    afterEnter.value = false
    selectRef.value?.hidePopup()
  }
}

const filter = (val: string, update: (callback: () => void) => void) => {
  if (val === '') {
    update(() => {
      optionsFiltered.value = props.options
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    optionsFiltered.value = props.options.filter((v: OptionType) => {
      let valueToSearch = ''
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        valueToSearch = v?.toString().toLowerCase() || ''
      } else if (v !== null && props.optionLabel && props.optionLabel in v) {
        valueToSearch = v[props.optionLabel]?.toString().toLowerCase() || ''
      }

      return valueToSearch.indexOf(needle) > -1
    })
  })
}
</script>

<style scoped lang="scss">
:deep(input.q-field__input) {
  field-sizing: content !important;
}
</style>
