<template lang="pug">
  div 
    .mb-2 关键词
      small （选填，最多可添加 {{maxTags}} 个）
    div(v-if='showTextInput')  
      textarea.form-control(
        rows='3',
        v-model='inputText',
        placeholder='请输入关键词，多个关键词请用逗号分隔。'
      )
      .mt-2
        button.btn.btn-sm.btn-default(@click='closeEditor') 保存
    div(v-else)
      div.flex.flex-wrap
        //- Tailwind capsule chips with right-side X button
        .flex.inline-flex.items-center.cursor-pointer.rounded-full.border.border-gray-300.border-solid.bg-gray-100.text-gray-700.px-3.py-1.mr-2.mb-2(
          title='点击删除'
          v-for='(tag, index) in keywords'
          :key='index'
           @click='removeKeyword(index)'
        )
          span.truncate.max-w-xs.mr-2 {{ tag }}
          <close theme="outline" class='h-[1.3rem]' size="13"/>
      button.btn.btn-sm.btn-default(@click='openEditor') 编辑
</template>

<script>
import { Close } from '@icon-park/vue';
import { editorStore } from '../../store/editor';

export default {
  data: () => ({
    inputText: '',
    showTextInput: false,
    maxTags: 50,
  }),
  components: {
    close: Close,
  },
  inject: ['metadataIndex'],
  computed: {
    keywords() {
      return editorStore.state.metadata[this.metadataIndex].keywords;
    },
  },
  methods: {
    openEditor() {
      this.inputText = this.keywords.join(', ');
      this.showTextInput = true;
    },
    closeEditor() {
      let newKeywords = this.inputText
        .replace(/，/g, ',')
        .replace(/\n/g, ',')
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      newKeywords = [...new Set(newKeywords)].slice(0, this.maxTags);
      this.showTextInput = false;
      editorStore.setKeywords(this.metadataIndex, newKeywords);
    },
    removeKeyword(index) {
      const next = this.keywords.slice();
      if (index >= 0 && index < next.length) {
        next.splice(index, 1);
        editorStore.setKeywords(this.metadataIndex, next);
      }
    },
  },
};
</script>
