<template lang="pug">
  div
    .mb-2 标题
      small （必填，最多100字符）
    textarea.form-control(
      rows=2
      placeholder="请输入标题...",
      v-model="text",
      @blur="handleChange"
    )
</template>

<script>
import { editorStore } from '../../store/editor';
export default {
  name: 'TitleField',
  data: () => ({
    text: '',
  }),
  computed: {
    title() {
      return editorStore.state.title;
    },
    titleLength() {
      return NKC.methods.checkData.getLength(this.title);
    },
  },
  methods: {
    handleChange() {
      editorStore.setTitle(this.text);
    },
  },
};
</script>
