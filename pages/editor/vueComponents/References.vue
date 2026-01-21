<template lang="pug">
  div
    reference-selector(ref="referenceSelector")
    .mb-2.flex.items-center.gap-x-2
      span 参考文献
      small （选填）
    div(class="flex flex-col gap-y-2 mb-3")
      .panel.panel-default(v-for="(refItem, index) in references" :key="refItem._id || refItem.id || index")
        .panel-heading.flex.justify-between.items-center
          div {{ refItem.title || '未命名' }}
          .flex.gap-x-2
            button.btn.btn-xs.btn-default(@click="moveReference(index, 'up')" :disabled="index === 0") 上移
            button.btn.btn-xs.btn-default(@click="moveReference(index, 'down')" :disabled="index === references.length - 1") 下移
            button.btn.btn-xs.btn-danger(@click="removeReference(index)") 删除
        .panel-body.text-gray-700
          div.mb-1 {{ formatAuthors(refItem.authors) }}
          div.mb-1
            span {{ typeLabel(refItem.type) }}
            span(v-if="refItem.year")  · {{ refItem.year }}
          div.mb-1(v-if="refItem.journal") 期刊：{{ refItem.journal }}
            span(v-if="refItem.volume")  · 卷 {{ refItem.volume }}
            span(v-if="refItem.issue")  · 期 {{ refItem.issue }}
            span(v-if="refItem.startPage || refItem.endPage")  · 页 {{ refItem.startPage || '?' }}-{{ refItem.endPage || '?' }}
          div.mb-1(v-else-if="refItem.publisher") 出版社：{{ refItem.publisher }}
          div.mb-1(v-else-if="refItem.school") 学校：{{ refItem.school }}
          div.mb-1(v-if="refItem.doi") DOI：{{ refItem.doi }}
          div.mb-1(v-if="refItem.url") URL：{{ refItem.url }}

    button.btn.btn-default.btn-sm(@click='addReference') 添加
</template>

<script>
import ReferenceSelector from '../../lib/vue/ReferenceSelector';
import { editorStore } from '../store/editor';
export default {
  components: {
    'reference-selector': ReferenceSelector,
  },
  computed: {
    references() {
      return editorStore.state.references;
    },
  },
  methods: {
    addReference() {
      this.$refs.referenceSelector.open((references) => {
        const merged = this.mergeReferences([
          ...this.references,
          ...references,
        ]);
        editorStore.setReferences(merged);
      });
    },
    removeReference(index) {
      const list = [...this.references];
      list.splice(index, 1);
      editorStore.setReferences(list);
    },
    moveReference(index, type) {
      const list = [...this.references];
      const targetIndex = type === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) {
        return;
      }
      const swap = list[targetIndex];
      list[targetIndex] = list[index];
      list[index] = swap;
      editorStore.setReferences(list);
    },
    formatAuthors(authors) {
      if (Array.isArray(authors)) {
        return authors.filter(Boolean).join('、') || '作者不详';
      }
      return authors || '作者不详';
    },
    typeLabel(type) {
      const map = {
        journal: '期刊文章',
        book: '书籍',
        thesis: '学位论文',
        website: '网络资源',
      };
      return map[type] || '其他';
    },
    mergeReferences(list) {
      const map = new Map();
      list.forEach((item) => {
        const key = item._id || item.id || JSON.stringify(item);
        map.set(key, item);
      });
      return Array.from(map.values());
    },
    getData() {
      return {
        references: this.references,
      };
    },
  },
};
</script>
