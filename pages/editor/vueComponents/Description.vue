<template lang="pug">
  div
    .mb-2 文章说明
      small （选填）
    textarea.form-control(
      type="text",
      rows=4
      placeholder="请输入文章说明...",
      v-model="text",
      @blur="handleChange($event)"
    )
</template>

<script>
export default {
  data: () => ({
    text: '',
  }),
  computed: {
    handleChange() {
      // 设置文章介绍内容
    },
  },
};
</script>
