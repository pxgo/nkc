<template lang="pug">
div
  .mb-2.flex.justify-between 
    div 摘要
      small （选填，最多可输入1000字符）
    .text-right.text-muted(:class="{ warning: abstractLength > 1000 }") 
      span(:class='abstractLength > 1000? "text-danger": ""') {{ abstractLength }} / 1000
  div
    textarea.form-control(
      placeholder="请输入摘要...",
      rows=7,
      v-model="text"
      style="resize: vertical;"
    )
</template>

<script>
import { editorStore } from '../../store/editor';
export default {
  data: () => ({
    text: '',
  }),
  watch: {
    abstract() {
      this.text = this.abstract;
    },
  },
  inject: ['metadataIndex'],
  computed: {
    abstract() {
      return editorStore.state.metadata[this.metadataIndex].abstract;
    },
    abstractLength() {
      return NKC.methods.checkData.getLength(this.abstract);
    },
  },
  methods: {
    onBlur() {
      // 设置摘要内容
      editorStore.setAbstract(this.metadataIndex, this.text);
    },
  },
};
</script>
