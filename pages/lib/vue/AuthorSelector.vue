<template lang="pug">
  draggable-dialog(ref="dialog" title="选择作者" :width="'320px'" :height="'400px'" :heightXS="'80%'")
    .h-full.flex.flex-col
      .flex-1.w-full.flex.justify-center.items-center(v-if="loading") 加载中...
      .flex-1.w-full.overflow-y-auto.p-4(v-else-if='showEditor') 
        //- 作者编辑表单
        .form-group
          label 姓氏
            span.text-danger *
          input.form-control(type="text" v-model.trim="form.familyName" placeholder="请输入姓")
        .form-group
          label 名字
            span.text-danger *
          input.form-control(type="text" v-model.trim="form.givenName" placeholder="请输入名")
        .form-group
          label KCID
          input.form-control(type="text" v-model.number="form.kcid" placeholder="请输入KCID")
        .form-group
          label ORCID
          input.form-control(type="text" v-model.trim="form.orcid" placeholder="请输入ORCID")
        .form-group
          label 机构DOI
          input.form-control(type="text" v-model.trim="form.agencyDOI" placeholder="请输入机构DOI")  
        .form-group
          label 机构名称
          input.form-control(type="text" v-model.trim="form.agencyName" placeholder="请输入机构名称")
        .form-group
          label 机构地址
          textarea.form-control(rows=2 v-model.trim="form.agencyAddress" placeholder="请输入机构地址")
        
        .form-group
          .checkbox
            label
              input(type="checkbox" v-model="form.contact")
              | 作为通讯作者
        template(v-if="form.contact")
          .form-group
            label 邮箱
              span.text-danger *
            input.form-control(type="text" v-model.trim="form.email" placeholder="请输入电子邮箱")
          .form-group
            label 电话
            input.form-control(type="text" v-model.trim="form.tel" placeholder="请输入电话")
          .form-group
            label 地址
            textarea.form-control(rows=2 v-model.trim="form.address" placeholder="请输入通讯地址")
          .form-group
            label 邮编
            input.form-control(type="text" v-model.number="form.postalCode" placeholder="请输入邮编")  
      .flex-1.w-full.flex.flex-col.justify-center.items-center(v-else-if='authors.length === 0') 
        .mb-2 空空如也
        div 请点击下方“新建作者”按钮添加作者。
      .flex-1.w-full.overflow-y-auto.flex.flex-col.gap-y-2.py-2(v-else)
        div(
          v-for="(author, index) in authors" 
          :key="`author-${index}`" 
          class="p-2 mx-2 flex border border-gray-300 rounded bg-gray-100" 
          )
          div.w-6.flex-none
            label
              input(type="checkbox" :value="author._id" v-model="selectedAuthorsId")
          div
            div.text-md {{author.familyName}} {{author.givenName}}
            div.text-md {{author.agencyName}} {{author.agencyAddress}}
            .mt-2
              button.mr-2.btn.btn-xs.btn-default(@click="editAuthor(author)") 编辑    
              button.btn.btn-xs.btn-danger(@click="deleteAuthor(author)") 删除
              
      div.flex.justify-end.flex-row.px-2.pb-2(v-if='showEditor')
        div
          button.mr-2.btn.btn-default.btn-sm.mt-2(@click="hideEditor") 取消并返回
          button.btn.btn-primary.btn-sm.mt-2(@click="save") 保存
      div.flex.flex-row.justify-between.px-2.pb-2(v-else)
        div
          button.btn.btn-default.btn-sm.mt-2(@click="newAuthor") 新建作者
        div
          button.mr-2.btn.btn-default.btn-sm.mt-2(@click="close") 取消  
          button.btn.btn-primary.btn-sm.mt-2(@click="submit") 确定      
          
          

</template>

<script>
import DraggableDialog from './DraggableDialog/DraggableDialog.vue';
import {
  checkKCID,
  checkEmail,
  checkPostalCode,
  checkAgencyDOINumber,
  checkUserORCIDNumber,
  checkTel,
} from '../js/checkData.js';
import { nkcAPI } from '../js/netAPI';
import { sweetQuestion } from '../js/sweetAlert.js';
const defaultAuthor = {
  _id: '',
  familyName: '',
  givenName: '',
  kcid: '',
  orcid: '',
  agencyName: '',
  agencyAddress: '',
  agencyDOI: '',
  contact: false,
  email: '',
  tel: '',
  address: '',
  postalCode: '',
};
export default {
  name: 'AuthorSelector',
  components: {
    'draggable-dialog': DraggableDialog,
  },
  data: () => {
    return {
      loading: true,
      showEditor: false,
      selectedAuthorsId: [],
      form: {
        ...defaultAuthor,
      },
      authors: [],
    };
  },
  methods: {
    open() {
      this.$refs.dialog.open();
      this.loadAuthors();
    },
    close() {
      this.$refs.dialog.close();
    },

    newAuthor() {
      this.form = { ...defaultAuthor };
      this.showEditor = true;
    },

    hideEditor() {
      this.showEditor = false;
    },

    checkForm() {
      if (!this.form.familyName) {
        throw new Error('请输入姓氏');
      }
      if (!this.form.givenName) {
        throw new Error('请输入名字');
      }
      if (this.form.kcid) {
        checkKCID(this.form.kcid);
      }
      if (this.form.ocrid) {
        checkUserORCIDNumber(this.form.ocrid);
      }
      if (this.form.agencyDOI) {
        checkAgencyDOINumber(this.form.agencyDOI);
      }
      if (this.form.contact) {
        if (!this.form.email) {
          throw new Error('请输入邮箱');
        }
        checkEmail(this.form.email);
        if (this.form.tel) {
          checkTel(this.form.tel);
        }
        if (this.form.postalCode) {
          checkPostalCode(this.form.postalCode);
        }
      }
    },

    save() {
      return Promise.resolve()
        .then(() => {
          return this.checkForm();
        })
        .then(() => {
          if (this.form._id) {
            // 编辑
            return nkcAPI(
              `/api/v1/settings/authors/${this.form._id}`,
              'PATCH',
              {
                author: {
                  ...this.form,
                },
              },
            );
          } else {
            // 新建
            return nkcAPI(`/api/v1/settings/authors`, 'POST', {
              author: {
                ...this.form,
              },
            });
          }
        })
        .then(() => {
          return this.loadAuthors();
        })
        .then(() => {
          this.showEditor = false;
        })
        .catch(sweetError);
    },

    editAuthor(author) {
      this.form = { ...author };
      this.showEditor = true;
    },

    deleteAuthor(author) {
      return sweetQuestion('确认删除该作者？删除后不可恢复！')
        .then(() => {
          return nkcAPI(`/api/v1/settings/authors/${author._id}`, 'DELETE', {});
        })
        .then(() => {
          return this.loadAuthors();
        })
        .catch(sweetError);
    },

    submit() {},

    loadAuthors() {
      this.loading = true;
      return nkcAPI(`/api/v1/settings/authors`, 'GET')
        .then((resp) => {
          this.authors = resp.data.authors;
        })
        .catch((err) => {
          sweetError(err);
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
};
</script>

<style lang="less">
.author-selector-content {
}
</style>
