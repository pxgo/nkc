<template lang="pug">
  div
    .mb-2.flex.items-center.gap-x-2
      span 经费来源
      small （选填）

    .flex.flex-col.gap-y-3.mb-3
      .panel.panel-default(v-for="(item, index) in funders" :key="index")
        .panel-heading.flex.justify-between.items-center
          div 经费来源 {{ index + 1 }}
          button.btn.btn-xs.btn-danger(@click="removeFunder(index)") 删除
        .panel-body.flex.flex-col.gap-y-3
          .form-group.mb-0
            .mb-1 机构名称
              span.text-danger *
            input.form-control(
              type="text"
              :value="item.name"
              placeholder="请输入机构名称"
              @input="updateFunder(index, { name: $event.target.value.trim() })"
            )
          .form-group.mb-0
            .mb-1 机构DOI
            input.form-control(
              type="text"
              :value="item.doi"
              placeholder="可选，例：10.1234/abcd"
              @input="updateFunder(index, { doi: $event.target.value.trim() })"
            )
          .form-group.mb-0
            .mb-1 资助项目编号
            input.form-control(
              type="text"
              :value="item.awardCode || ''"
              placeholder="请输入项目编号"
              @input="updateFunder(index, { awardCode: $event.target.value.trim() })"
            )

    button.btn.btn-default.btn-sm(@click="addFunder") 添加资助机构
</template>

<script>
import { editorStore } from '../store/editor';

export default {
  computed: {
    funders() {
      return editorStore.state.funders;
    },
  },
  methods: {
    addFunder() {
      const list = [
        ...this.funders,
        {
          name: '',
          doi: '',
          awardCode: '',
        },
      ];
      editorStore.setFunders(list);
    },
    removeFunder(index) {
      const list = [...this.funders];
      list.splice(index, 1);
      editorStore.setFunders(list);
    },
    updateFunder(index, payload) {
      const list = [...this.funders];
      list[index] = { ...list[index], ...payload };
      editorStore.setFunders(list);
    },
    updateAwardCodes(index, text) {
      this.updateFunder(index, { awardCode: text.trim() });
    },
    getData() {
      return {
        funders: this.funders,
      };
    },
  },
};
</script>
