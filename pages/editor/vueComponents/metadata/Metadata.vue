<template lang="pug">
  .panel(:class='metadataIndex === 0? "panel-info": "panel-default"')
    .panel-heading.flex.justify-between.items-center
      .flex.items-center.gap-x-2
        select.form-control.input-sm(v-model='metadata.lang' style='width: auto;')
          option(
            v-for='langType in languagesTypesArray' 
            :value='langType.code'
            :selected='metadata.lang === langType.code'
            ) {{ langType.name }}

      .flex.gap-x-2
        button.btn.btn-xs.btn-default(@click='moveMetadata("up")') 上移
        button.btn.btn-xs.btn-default(@click='moveMetadata("down")') 下移
        button.btn.btn-xs.btn-default(@click='fold = !fold') {{ fold ? "展开" : "折叠" }}
        button.btn.btn-xs.btn-danger(@click='removeMetadata') 删除
    .panel-body(v-if='fold')
      .flex.justify-center.items-center.h-6.gap-x-2.text-muted
        span 已折叠
    .panel-body(v-else)
      .m-b-2
        title-info
      .m-b-2
        author-info  
      .m-b-2
        abstract
      .m-b-2
        keywords  
      
</template>

<script>
import Title from './Title.vue';
import Abstract from './Abstract.vue';
import Keywords from './Keywords.vue';
import AuthorInfo from './AuthorInfo.vue';
import { sweetQuestion } from '../../../lib/js/sweetAlert';
import { editorStore } from '../../store/editor';
import { languagesTypesArray } from '../../../lib/js/language';
export default {
  components: {
    'title-info': Title,
    abstract: Abstract,
    keywords: Keywords,
    'author-info': AuthorInfo,
  },
  data: () => ({
    fold: false,
    languagesTypesArray,
  }),
  props: ['metadataIndex'],
  provide() {
    return {
      metadataIndex: this.metadataIndex,
    };
  },
  computed: {
    metadata() {
      return editorStore.state.metadata[this.metadataIndex];
    },
  },
  methods: {
    removeMetadata() {
      sweetQuestion('确定要删除该组元信息？')
        .then(() => {
          editorStore.removeMetadataAt(this.metadataIndex);
        })
        .catch(() => {});
    },
    // type: up | down
    moveMetadata(type) {
      editorStore.moveMetadata(this.metadataIndex, type);
    },
  },
};
</script>
