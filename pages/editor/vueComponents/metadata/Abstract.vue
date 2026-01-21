<template lang="pug">
div
  .mb-2.flex.justify-between
    div 摘要
      small （选填，最多可输入1000字符）
    .text-right.text-muted(:class='{ warning: abstractLength > 1000 }') 
      span(:class='abstractLength > 1000 ? "text-danger" : ""') {{ abstractLength }} / 1000
  div
    textarea.form-control(
      placeholder='请输入摘要...',
      rows=7,
      v-model='abstract',
      style='resize: vertical'
    )
</template>

<script lang="ts">
import { computed, inject } from '@vue/composition-api';
import { editorStore } from '../../store/editor';
import { getLength } from '@/lib/js/checkData';
export default {
  setup() {
    const metadataIndex = inject<number>('metadataIndex') as number;

    const abstract = computed({
      get: () => editorStore.state.metadata[metadataIndex].abstract,
      set: (val) => editorStore.setAbstract(metadataIndex, val),
    });

    const abstractLength = computed(() => {
      return getLength(abstract.value);
    });
    return {
      metadataIndex,
      abstract,
      abstractLength,
      editorStore,
    };
  },
};
</script>
