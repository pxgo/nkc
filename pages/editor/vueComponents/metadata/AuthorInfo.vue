<template lang="pug">
  .author-info
    author-selector(ref='authorSelector')
    .editor-header.mb-2 作者信息
      small （选填，信息将公开显示）
    .editor-authors
      div(v-for="(author, index) of authors" :key="`author-info-${index}`")
        .panel.panel-default
          .panel-heading.flex.justify-between.items-center
            div {{author.familyName}} {{author.givenName}}
            .flex.gap-x-2
              button.btn.btn-xs.btn-default(class="flex items-center" @click="toggleContact(index)") 
                span.mr-1 通讯作者
                input(type='checkbox' class='m-t-0' v-model='author.contact')
              button.btn.btn-xs.btn-default(@click="moveAuthor(index, 'up')" :disabled="index === 0") 上移
              button.btn.btn-xs.btn-default(@click="moveAuthor(index, 'down')" :disabled="index === authors.length - 1") 下移
              button.btn.btn-xs.btn-danger(@click="deleteAuthor(index)") 删除
          .panel-body
            .row
              .col-xs-12.col-md-6
                div(v-if='author.photo' class='max-w-[100%] w-[150px] mb-2')
                  img.img-responsive.pointer(
                    :src="getUrl('authorPhoto', author.photo)" 
                    alt="作者照片"
                    data-global-click='viewImage' 
                    :data-global-data="objToStr({name: 'author photo', url: getUrl('authorPhoto', author.photo)})"
                     )
                div(v-if='author.kcid') {{userIdName}}: 
                  a(:href="getUrl('userHome', author.kcid)" target="_blank") {{author.kcid}}
                div(v-if='author.orcid') ORCID: 
                  a(:href="getUrl('orcid', author.orcid)" target="_blank") {{author.orcid}}
                div(v-if='author.email') 邮箱: {{author.email}}
                div(v-if='author.tel') 电话: {{author.tel}}
                div(v-if='author.address') 地址: {{author.address}}
                div(v-if='author.postalCode') 邮编: {{author.postalCode}}
              .col-xs-12.col-md-6    
                div(v-if='author.agencyName') 机构名称: {{author.agencyName}}
                div(v-if='author.agencyDOI') 机构DOI: 
                  a(:href="getUrl('doi', author.agencyDOI)" target="_blank") {{author.agencyDOI}}
                div(v-if='author.agencyAddress') 机构地址: {{author.agencyAddress}}
      button.btn.btn-default.btn-sm(:disabled="authors && authors.length > 50" @click.stop="addAuthor") 添加
</template>

<script>
import { getState } from '../../../lib/js/state';
import AuthorSelector from '../../../lib/vue/AuthorSelector.vue';
import { sweetError } from '../../../lib/js/sweetAlert';
import { getUrl } from '../../../lib/js/tools';
import { editorStore } from '../../store/editor';
import { objToStr } from '../../../lib/js/dataConversion';
const state = getState();
const websiteCode = state.websiteCode || 'KC';
export default {
  data: () => ({}),
  components: {
    'author-selector': AuthorSelector,
  },
  computed: {
    authors() {
      return editorStore.state.metadata[this.metadataIndex].authors;
    },
    userIdName() {
      return `${websiteCode.toUpperCase()}ID`;
    },
  },
  inject: ['metadataIndex'],
  methods: {
    getUrl,
    objToStr,
    deleteAuthor(index) {
      sweetQuestion('确定要删除该条作者信息？')
        .then(() => {
          editorStore.removeAuthorAt(this.metadataIndex, index);
        })
        .catch(sweetError);
    },
    toggleContact(index) {
      editorStore.toggleAuthorContact(this.metadataIndex, index);
    },
    moveAuthor(index, type) {
      editorStore.moveAuthor(this.metadataIndex, index, type);
    },
    addAuthor() {
      this.$refs.authorSelector.open((authors) => {
        const merged = this.mergeAuthors(authors);
        editorStore.setAuthors(this.metadataIndex, merged);
      });
    },
    mergeAuthors(newAuthors) {
      const map = new Map();
      [...this.authors, ...newAuthors].forEach((a) => {
        const key = a._id || a.id || JSON.stringify(a);
        map.set(key, a);
      });
      return Array.from(map.values());
    },
  },
};
</script>

<style scoped></style>
