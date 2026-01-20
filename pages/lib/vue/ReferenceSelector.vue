<template lang="pug">
  draggable-dialog(ref="dialog" title="参考文献" :width="'500px'" :height="'500px'" :heightXS="'80%'")
    div(v-if='loading' class='flex flex-col h-full')
      div 加载中...
    div(v-else-if='showEditor' class='flex flex-col h-full')
      div.p-4.flex-1(class='overflow-y-auto')
        .form-group
          label 类型
          .radio
            label.mr-4
              input(type='radio' value='journal' v-model='form.type')
              span 期刊文章 
            label.mr-4
              input(type='radio' value='book' v-model='form.type')
              span 书籍
            label.mr-4
              input(type='radio' value='thesis' v-model='form.type')
              span 学位论文
            label
              input(type='radio' value='website' v-model='form.type')
              span 网络资源      
        .form-group
          label 标题
            span.text-danger *
          textarea.form-control(rows=2 v-model.trim='form.title' placeholder='请输入参考文献标题')
        .form-group
          label 作者
            span.text-danger *
          textarea.form-control(rows=2 v-model.trim='form.authors' placeholder='请输入参考文献作者，多个作者请用逗号分隔，如：张三, 李四, 王五')      
        template(v-if='form.type === "journal"')  
          .form-group
            label 期刊名
              span.text-danger *
            textarea.form-control(rows=2 v-model.trim='form.journal' placeholder='请输入期刊名')
          .form-group
            label 期刊卷号
              span.text-danger *
            input.form-control(type='text' v-model.trim='form.volume' placeholder='请输入期刊卷号')  
          .form-group
            label 期刊期号
              span.text-danger *
            input.form-control(type='text' v-model.trim='form.issue' placeholder='请输入期刊期号')  
          .form-group
            label 起始页码
              span.text-danger *
            input.form-control(type='number' v-model.number='form.startPage' placeholder='请输入起始页码')  
          .form-group
            label 结束页码
              span.text-danger *
            input.form-control(type='number' v-model.number='form.endPage' placeholder='请输入结束页码')  
          .form-group
            label 出版年份
              span.text-danger *
            input.form-control(type='number' v-model.number='form.year' placeholder='请输入出版年份')  
        template(v-else-if='form.type === "book"')    
          .form-group
            label 出版社
              span.text-danger *
            textarea.form-control(rows=2 v-model.trim='form.publisher' placeholder='请输入出版社名称')
          .form-group
            label 出版年份
              span.text-danger *
            input.form-control(type='number' v-model.number='form.year' placeholder='请输入出版年份')  
        template(v-else-if='form.type === "thesis"')
          .form-group
            label 学校名称
              span.text-danger *
            textarea.form-control(rows=2 v-model.trim='form.school' placeholder='请输入学校名称')
          .form-group
            label 出版年份
              span.text-danger *
            input.form-control(type='number' v-model.number='form.year' placeholder='请输入出版年份')  

        .form-group
          label DOI
          input.form-control(type='text' v-model.trim='form.doi' placeholder='请输入DOI')  
        .form-group
          label URL
          textarea.form-control(rows=3 v-model.trim='form.url' placeholder='请输入URL')

      div(class='flex justify-end p-2 gap-x-2')
        button.btn.btn-sm.btn-default(@click='closeEditor') 取消并返回
        button.btn.btn-sm.btn-primary(@click='createReference') 保存        

    
    div(v-else class='flex flex-col h-full')
      div(v-if='references.length === 0' class='flex-1 p-2 flex justify-center items-center flex-col') 
        .mb-2 空空如也
        div 请点击下方“新建参考文献”按钮添加参考文献。
      div(v-else class='flex-1 p-2 flex flex-col gap-y-3 overflow-y-auto')
        div.border.rounded.p-3.bg-white.shadow-sm.flex.gap-x-3.items-start(v-for='item in references' :key='item._id || item.id')
          div.w-6.flex-none
            label
              input(type='checkbox' :value='item._id || item.id' v-model='selectedReferencesId')
          div.flex-1
            div.font-bold.mb-1 {{ item.title || '未命名' }}
            div.text-gray-600.mb-1 {{ formatAuthors(item.authors) }}
            div.text-gray-600.mb-1
              span {{ typeLabel(item.type) }}
              span(v-if='item.year')  · {{ item.year }}
            div.text-gray-600(v-if='item.journal')
              span 期刊：{{ item.journal }}
              span(v-if='item.volume')  · 卷 {{ item.volume }}
              span(v-if='item.issue')  · 期 {{ item.issue }}
              span(v-if='item.startPage || item.endPage')  · 页 {{ item.startPage || '?' }}-{{ item.endPage || '?' }}
            div.text-gray-600(v-else-if='item.publisher') 出版社：{{ item.publisher }}
            div.text-gray-600(v-else-if='item.school') 学校：{{ item.school }}
            div.text-gray-600(v-if='item.doi') DOI：{{ item.doi }}
            div.text-gray-600(v-if='item.url') URL：{{ item.url }}

      div(class="flex justify-between items-center p-2")
        div.flex.gap-x-2.items-center
          button.btn.btn-sm.btn-default(@click='newReference') 新建参考文献
        div.flex.items-center.gap-x-2
          paging-component(v-if='paging.buttonValue && paging.buttonValue.length'
            :pages='paging.buttonValue'
            :mt='0'
            :mb='0'
            @click-button='handlePageChange'
          )
          button.btn.btn-sm.btn-default(@click='close') 取消
          button.btn.btn-sm.btn-primary(@click='confirmSelect') 确定
        
</template>

<script>
import DraggableDialog from './DraggableDialog/DraggableDialog.vue';
import { nkcAPI } from '../js/netAPI';
import Paging from './Paging.vue';
import { sweetError } from '../js/sweetAlert';
const defaultForm = {
  type: 'journal',
  title: '',
  authors: '',
  journal: '',
  volume: '',
  issue: '',
  startPage: null,
  endPage: null,
  year: null,
  publisher: '',
  school: '',
  doi: '',
  url: '',
};
export default {
  data: () => ({
    loading: true,
    saving: false,
    callback: null,
    showEditor: false,
    references: [],
    paging: { buttonValue: [] },
    selectedReferencesId: [],
    form: {
      ...defaultForm,
    },
  }),
  components: {
    'draggable-dialog': DraggableDialog,
    'paging-component': Paging,
  },
  methods: {
    open(callback) {
      this.selectedReferencesId = [];
      this.callback = callback;
      this.$refs.dialog.open();
      this.getReferences();
    },
    getReferences(page = 1) {
      this.loading = true;
      nkcAPI('/api/v1/settings/references', 'GET', { page })
        .then((res) => {
          const { references = [], paging = { buttonValue: [] } } = res.data;
          this.references = references;
          this.paging = paging || { buttonValue: [] };
          this.loading = false;
        })
        .catch((err) => {
          sweetError(err);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    close() {
      this.$refs.dialog.close();
    },
    newReference() {
      this.form = { ...defaultForm };
      this.showEditor = true;
    },
    closeEditor() {
      this.showEditor = false;
    },
    createReference() {
      this.saving = true;
      nkcAPI('/api/v1/settings/references', 'POST', {
        reference: {
          ...this.form,
          authors: this.form.authors
            .replace(/\n/g, ',')
            .replace(/，/g, ',')
            .split(',')
            .map((a) => a.trim()),
        },
      })
        .then((res) => {
          this.getReferences();
          this.showEditor = false;
        })
        .catch((err) => {
          sweetError(err);
        })
        .finally(() => {
          this.saving = false;
        });
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
    handlePageChange(pageIndex) {
      this.getReferences(pageIndex + 1);
    },
    confirmSelect() {
      if (this.callback) {
        this.callback(this.selectedReferences);
      }
      this.close();
    },
  },
  computed: {
    selectedReferences() {
      const ids = new Set(this.selectedReferencesId);
      return this.references.filter((r) => ids.has(r._id || r.id));
    },
  },
};
</script>

<style scoped>
textarea {
  resize: vertical;
}
</style>
