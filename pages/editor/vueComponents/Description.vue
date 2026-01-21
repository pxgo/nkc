<template lang="pug">
  div
    .mb-2.flex.items-center.gap-x-2
      span 文章说明
      small （选填，展示创作背景/过程/心情等，不作为正文）
    textarea.form-control(
      rows=5
      placeholder="写下想与读者分享的背景、过程或心情..."
      v-model="descriptionText"
      style="resize: vertical;"
    )
</template>

<script>
import { editorStore } from '../store/editor';

export default {
  computed: {
    descriptionText: {
      get() {
        return editorStore.state.description;
      },
      set(val) {
        editorStore.setDescription(val);
      },
    },
  },
  methods: {
    getData() {
      return {
        description: this.descriptionText,
      };
    },
  },
};
</script>
