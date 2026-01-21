<template lang="pug">
  draggable-dialog(ref="dialog" title="选择作者" :width="'400px'" :height="'500px'" :heightXS="'80%'")
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
          label 介绍
          textarea.form-control(rows=2 v-model.trim="form.introduction" placeholder="请输入介绍")  
        .form-group
          label 照片
          div
            img(v-if="photoUrl" :src="photoUrl" class="w-full mb-2")
          input.form-control.hidden(type="file" ref='imageInput' accept="image/jpeg,image/png,image/jpg" @change="onImageChange")  
          button.btn.btn-default.btn-sm.mt-2.mr-2(@click='$refs.imageInput.click()') {{form.photo ? '更换' : '上传'}}照片
          button.btn.btn-default.btn-sm.mt-2(@click='removeImage' v-if='photoUrl') 移除
        .form-group
          label 邮箱
            span.text-danger *
          input.form-control(type="text" v-model.trim="form.email" placeholder="请输入电子邮箱")
        .form-group
          label 电话
          input.form-control(type="text" v-model.trim="form.tel" placeholder="请输入电话")
        .form-group
          label 邮编
          input.form-control(type="text" v-model="form.postalCode" placeholder="请输入邮编")      
        .form-group
          label 通信地址
          textarea.form-control(rows=2 v-model.trim="form.address" placeholder="请输入通信地址")
        .form-group
          label KCID
          input.form-control(type="text" v-model.number="form.kcid" placeholder="请输入KCID")
        .form-group
          label ORCID
          input.form-control(type="text" v-model.trim="form.orcid" placeholder="请输入ORCID" @blur="onORCIDBlur")  
        .form-group
          label 机构DOI
          input.form-control(type="text" v-model.trim="form.agencyDOI" placeholder="请输入机构DOI" @blur="onAgencyDOIBlur")  
        .form-group
          label 机构名称
          input.form-control(type="text" v-model.trim="form.agencyName" placeholder="请输入机构名称")
        .form-group
          label 机构地址
          textarea.form-control(rows=2 v-model.trim="form.agencyAddress" placeholder="请输入机构地址")

          
      .flex-1.w-full.flex.flex-col.justify-center.items-center(v-else-if='currentList.length === 0') 
        template(v-if='!showRecycle')
          .mb-2 空空如也
          div 请点击下方“新建作者”按钮添加作者。
        template(v-else)
          .mb-2 回收站为空
          div 没有已删除的作者。
      .flex-1.w-full.overflow-y-auto.flex.flex-col.gap-y-2.py-2(v-else)
        div(
          v-for="(author, index) in currentList" 
          :key="`author-${index}`" 
          class="mx-2" 
          )
          .panel.panel-default
            .panel-heading.py-2.mb-0
              div.flex.items-center
                div.flex-1 {{author.familyName}} {{author.givenName}}
                div.flex-none.gap-x-2.flex.items-center
                  template(v-if="!showRecycle")
                    button.btn.btn-xs.btn-default(@click="deleteAuthor(author)") 删除 
                    button.btn.btn-xs(
                      :class='selectedAuthorsId.includes(author._id)? "btn-primary": "btn-default"' 
                      @click='selectAuthor(author)'
                      ) {{selectedAuthorsId.includes(author._id) ? '已选择' : '选择'}}
                  template(v-else)
                    button.btn.btn-xs.btn-default(@click="restoreAuthor(author)") 恢复
            .panel-body.flex.flex-col.gap-y-2
              img(:src="getUrl('authorPhoto', author.photo)" alt="作者照片" class="w-full mb-2" v-if="author.photo")
              .info-grid
                div.info-row(v-if="author.kcid")
                  span.info-label KCID
                  span.info-value {{author.kcid}}
                div.info-row(v-if="author.orcid")
                  span.info-label ORCID
                  span.info-value {{author.orcid}}
                div.info-row(v-if="author.email")
                  span.info-label 邮箱
                  span.info-value {{author.email}}
                div.info-row(v-if="author.tel")
                  span.info-label 电话
                  span.info-value {{author.tel}}
                div.info-row(v-if="author.postalCode")
                  span.info-label 邮编
                  span.info-value {{author.postalCode}}
                div.info-row(v-if="author.address")
                  span.info-label 地址
                  span.info-value {{author.address}}
                div.info-row(v-if="author.agencyName")
                  span.info-label 机构名称
                  span.info-value {{author.agencyName}}
                div.info-row(v-if="author.agencyAddress")
                  span.info-label 机构地址
                  span.info-value {{author.agencyAddress}}
                div.info-row(v-if="author.agencyDOI")
                  span.info-label 机构DOI
                  span.info-value {{author.agencyDOI}}
            
              
      div.flex.justify-end.flex-row.px-2.pb-2(v-if='showEditor')
        div
          button.mr-2.btn.btn-default.btn-sm.mt-2(@click="hideEditor") 取消并返回
          button.btn.btn-primary.btn-sm.mt-2(@click="save" :disabled="submitting") 保存{{submitting?"中": ''}}
      div.flex.flex-row.justify-between.px-2.pb-2(v-else)
        div.flex.gap-x-2.items-center
          button.btn.btn-default.btn-sm.mt-2(@click="newAuthor" :disabled="showRecycle") 新建作者
          button.btn.btn-default.btn-sm.mt-2(@click="toggleRecycle") {{ showRecycle ? '返回列表' : '回收站' }}
        div
          button.mr-2.btn.btn-default.btn-sm.mt-2(@click="close") 取消  
          button.btn.btn-primary.btn-sm.mt-2(
            @click="submit" 
            :disabled="selectedAuthorsId.length === 0 || submitting"
            :title="selectedAuthorsId.length === 0 ? '请至少选择一位作者' : ''"
            ) 确定      
          
          

</template>

<script>
import DraggableDialog from './DraggableDialog/DraggableDialog.vue';
import { getFileObjectUrl } from '../js/file.js';
import {
  checkKCID,
  checkEmail,
  checkPostalCode,
  checkAgencyDOINumber,
  checkUserORCIDNumber,
  checkTel,
} from '../js/checkData.js';
import { nkcUploadFile, nkcAPI } from '../js/netAPI';
import { sweetQuestion } from '../js/sweetAlert.js';
import { getUrl } from '../js/tools.js';
const defaultAuthor = {
  _id: '',
  familyName: '',
  givenName: '',
  introduction: '',
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
  photo: '',
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
      showRecycle: false,
      selectedAuthorsId: [],
      form: {
        ...defaultAuthor,
      },
      authors: [],
      photoFile: null,
      submitting: false,
    };
  },
  computed: {
    photoUrl() {
      if (this.photoFile) {
        return getFileObjectUrl(this.photoFile);
      }
      return this.form.photo;
    },
    selectedAuthors() {
      return this.authors.filter((author) =>
        this.selectedAuthorsId.includes(author._id),
      );
    },
    currentList() {
      return this.authors;
    },
  },
  methods: {
    getUrl,
    open(callback) {
      this.selectedAuthorsId = [];
      this.photoFile = null;
      this.showRecycle = false;
      this.loadAuthors();
      this.callback = callback;
      this.$refs.dialog.open();
    },
    close() {
      this.$refs.dialog.close();
    },
    removeImage() {
      this.form.photo = '';
      this.photoFile = null;
    },
    onImageChange() {
      // 当选择完图片后
      const file = this.$refs.imageInput.files[0];
      this.photoFile = file;
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
      if (this.form.orcid) {
        checkUserORCIDNumber(this.form.orcid);
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

    selectAuthor(author) {
      const index = this.selectedAuthorsId.indexOf(author._id);
      if (index === -1) {
        this.selectedAuthorsId.push(author._id);
      } else {
        this.selectedAuthorsId.splice(index, 1);
      }
    },

    save() {
      return Promise.resolve()
        .then(() => {
          this.submitting = true;
          return this.checkForm();
        })
        .then(() => {
          const formData = new FormData();
          if (this.photoFile) {
            formData.append('photo', this.photoFile);
          }
          formData.append('author', JSON.stringify(this.form));
          if (this.form._id) {
            // 编辑
            return nkcUploadFile(
              `/api/v1/settings/authors/${this.form._id}`,
              'PATCH',
              formData,
            );
          } else {
            // 新建
            return nkcUploadFile(`/api/v1/settings/authors`, 'POST', formData);
          }
        })
        .then(() => {
          return this.loadAuthors();
        })
        .then(() => {
          this.showEditor = false;
        })
        .catch(sweetError)
        .finally(() => {
          this.submitting = false;
        });
    },

    // 编辑 暂时屏蔽
    editAuthor(author) {
      this.form = { ...author };
      this.showEditor = true;
    },

    deleteAuthor(author) {
      return sweetQuestion('确认删除该作者？删除后不可恢复！')
        .then(() => {
          return nkcAPI(
            `/api/v1/settings/authors?authorId=${author._id}`,
            'DELETE',
            {},
          );
        })
        .then(() => {
          return this.loadAuthors();
        })
        .catch(sweetError);
    },

    restoreAuthor(author) {
      return sweetQuestion('确认恢复该作者？')
        .then(() => {
          return nkcAPI(
            `/api/v1/settings/authors?authorId=${author._id}`,
            'PATCH',
            {},
          );
        })
        .then(() => {
          return this.loadAuthors();
        })
        .catch(sweetError);
    },

    submit() {
      this.callback && this.callback(this.selectedAuthors);
      this.close();
    },

    toggleRecycle() {
      this.showRecycle = !this.showRecycle;
      this.selectedAuthorsId = [];
      this.loadAuthors();
    },

    loadAuthors(page = 0) {
      this.loading = true;
      const status = this.showRecycle ? 'deleted' : 'normal';
      return nkcAPI(`/api/v1/settings/authors?status=${status}`, 'GET')
        .then((resp) => {
          const { authors = [] } = resp.data;
          this.authors = authors;
        })
        .catch((err) => {
          sweetError(err);
        })
        .finally(() => {
          this.loading = false;
        });
    },

    onORCIDBlur(e) {
      const raw =
        e && e.target && e.target.value ? String(e.target.value).trim() : '';
      if (!raw) return;
      if (!/https?:\/\//i.test(raw) && raw.indexOf('/') === -1) return;
      const oid = this.extractORCIDFromText(raw);
      if (oid) this.form.orcid = oid;
    },

    onAgencyDOIBlur(e) {
      const raw =
        e && e.target && e.target.value ? String(e.target.value).trim() : '';
      if (!raw) return;
      if (!/https?:\/\//i.test(raw) && raw.indexOf('/') === -1) return;
      const doi = this.extractDOIFromText(raw);
      if (doi) this.form.agencyDOI = doi;
    },

    extractORCIDFromText(text) {
      // ORCID 格式：0000-0000-0000-0000，最后一位可为数字或 X
      const m = text.match(/\b\d{4}-\d{4}-\d{4}-\d{3}[\dXx]\b/);
      return m ? m[0].toUpperCase() : '';
    },

    extractDOIFromText(text) {
      // DOI 规范匹配，排除空白及常见结束符号
      const m = text.match(/\b10\.[0-9]{4,9}\/[\w.();\/:-]+/i);
      if (!m) return '';
      let doi = m[0];
      // 去除可能尾随的标点
      doi = doi.replace(/[\s"'<>)]*$/g, '');
      return doi;
    },
  },
};
</script>

<style lang="less" scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 6px 12px;
}

.info-row {
  display: flex;
  align-items: baseline;
}

.info-label {
  width: 72px;
  color: #666;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}
</style>
