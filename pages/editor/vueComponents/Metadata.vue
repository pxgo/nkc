<template>
  <div class="metadata-editor">
    <div class="checkbox mt-0">
      <label>
        <input type="checkbox" v-model="enabled" value="true" />
        <span>申请 DOI</span>
      </label>
    </div>
    <div v-if="enabled">
      <div class="text-info">
        请填写下方元数据信息（标题、作者、摘要、关键词等），以便在提交文章的同时顺利申请
        DOI。
      </div>
      <div class="form-section">
        <h4 class="section-title">标题(titles)</h4>
        <div
          v-for="(item, idx) in form.titles"
          :key="`title-${idx}`"
          class="form-row inline"
        >
          <input
            v-model="item.lang"
            class="form-control narrow"
            placeholder="语言，如 zh/en"
          />
          <input
            v-model="item.text"
            class="form-control"
            placeholder="标题文本"
          />
          <button
            type="button"
            class="btn"
            @click="removeAt('titles', idx)"
            :disabled="form.titles.length === 1"
          >
            移除
          </button>
        </div>
        <button type="button" class="btn" @click="addTitle">添加标题</button>
      </div>

      <div class="form-section">
        <h4 class="section-title">摘要(abstract)</h4>
        <div
          v-for="(item, idx) in form.abstract"
          :key="`abs-${idx}`"
          class="form-row inline"
        >
          <input
            v-model="item.lang"
            class="form-control narrow"
            placeholder="语言"
          />
          <textarea
            v-model="item.text"
            class="form-control"
            placeholder="摘要"
          ></textarea>
          <button
            type="button"
            class="btn"
            @click="removeAt('abstract', idx)"
            :disabled="form.abstract.length === 1"
          >
            移除
          </button>
        </div>
        <button type="button" class="btn" @click="addAbstract">添加摘要</button>
      </div>

      <div class="form-section">
        <h4 class="section-title">关键词(keywords)</h4>
        <div
          v-for="(item, idx) in form.keywords"
          :key="`kw-${idx}`"
          class="form-row inline"
        >
          <input
            v-model="item.lang"
            class="form-control narrow"
            placeholder="语言"
          />
          <input
            v-model="item.text"
            class="form-control"
            placeholder="关键词，多个可用分号分隔"
          />
          <button
            type="button"
            class="btn"
            @click="removeAt('keywords', idx)"
            :disabled="form.keywords.length === 0"
          >
            移除
          </button>
        </div>
        <button type="button" class="btn" @click="addKeyword">
          添加关键词
        </button>
      </div>

      <div class="form-section">
        <h4 class="section-title">作者(authors)</h4>
        <div
          v-for="(item, idx) in form.authors"
          :key="`author-${idx}`"
          class="form-row multi"
        >
          <input
            v-model="item.firstname"
            class="form-control"
            placeholder="名 firstname"
          />
          <input
            v-model="item.lastname"
            class="form-control"
            placeholder="姓 lastname"
          />
          <input
            v-model="item.uid"
            class="form-control"
            placeholder="用户 UID"
          />
          <input
            v-model="item.orcid"
            class="form-control"
            placeholder="ORCID"
          />
          <input
            v-model="item.affiliation"
            class="form-control"
            placeholder="所属机构"
          />
          <button
            type="button"
            class="btn"
            @click="removeAt('authors', idx)"
            :disabled="form.authors.length === 0"
          >
            移除
          </button>
        </div>
        <button type="button" class="btn" @click="addAuthor">添加作者</button>
      </div>

      <div class="form-section">
        <h4 class="section-title">资助机构(funders)</h4>
        <div
          v-for="(item, idx) in form.funders"
          :key="`funder-${idx}`"
          class="form-row multi"
        >
          <input
            v-model="item.name"
            class="form-control"
            placeholder="机构名称"
          />
          <input
            v-model="item.doi"
            class="form-control"
            placeholder="机构 DOI"
          />
          <input
            v-for="(award, awardIdx) in item.awardNumber"
            :key="`award-${idx}-${awardIdx}`"
            v-model="item.awardNumber[awardIdx]"
            class="form-control"
            placeholder="项目编号"
          />
          <button type="button" class="btn" @click="item.awardNumber.push('')">
            添加项目编号
          </button>
          <button
            type="button"
            class="btn"
            @click="removeAt('funders', idx)"
            :disabled="form.funders.length === 0"
          >
            移除机构
          </button>
        </div>
        <button type="button" class="btn" @click="addFunder">
          添加资助机构
        </button>
      </div>

      <div class="form-section">
        <h4 class="section-title">参考文献(references)</h4>
        <div
          v-for="(item, idx) in form.references"
          :key="`ref-${idx}`"
          class="form-row inline"
        >
          <input
            v-model="item.type"
            class="form-control narrow"
            placeholder="类型，如 url/text"
          />
          <textarea
            v-model="item.content"
            class="form-control"
            placeholder="引用内容"
          ></textarea>
          <button
            type="button"
            class="btn"
            @click="removeAt('references', idx)"
            :disabled="form.references.length === 0"
          >
            移除
          </button>
        </div>
        <button type="button" class="btn" @click="addReference">
          添加参考
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MetadataEditor',
  props: ['source', 'sid'],
  data() {
    return {
      enabled: false,
      form: this.createDefaultForm(),
    };
  },
  methods: {
    createDefaultForm() {
      const now = new Date();
      const toLocal = (d) =>
        new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      return {
        source: '',
        sid: '',
        toc: toLocal(now),
        applydAt: '',
        registerdAt: '',
        doiStatus: '',
        funders: [],
        references: [],
        titles: [{ lang: 'zh', text: '' }],
        abstract: [{ lang: 'zh', text: '' }],
        keywords: [{ lang: 'zh', text: '' }],
        authors: [],
      };
    },
    addTitle() {
      this.form.titles.push({ lang: 'zh', text: '' });
    },
    addAbstract() {
      this.form.abstract.push({ lang: 'zh', text: '' });
    },
    addKeyword() {
      this.form.keywords.push({ lang: 'zh', text: '' });
    },
    addAuthor() {
      this.form.authors.push({
        firstname: '',
        lastname: '',
        uid: '',
        orcid: '',
        affiliation: '',
      });
    },
    addFunder() {
      this.form.funders.push({ name: '', doi: '', awardNumber: [''] });
    },
    addReference() {
      this.form.references.push({ type: '', content: '' });
    },
    removeAt(field, idx) {
      if (!this.form[field] || idx < 0) return;
      this.form[field].splice(idx, 1);
    },
    // TODO: add save/preview handlers
  },
};
</script>

<style scoped>
.metadata-editor {
}

.form-section {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.form-row.inline {
  flex-direction: row;
  align-items: center;
}

.form-row.multi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  align-items: start;
}

.form-label {
  font-weight: 600;
}

.form-control {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
}

.form-control.narrow {
  max-width: 140px;
}

.btn {
  align-self: flex-start;
  padding: 6px 10px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background: #f8f8f8;
  cursor: pointer;
}

.btn:hover {
  background: #f0f0f0;
}
</style>
