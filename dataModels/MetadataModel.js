// post, document 对应的元数据
const { apply } = require('file-loader');
const mongoose = require('../settings/database');

const referencesSchema = new mongoose.Schema(
  {
    // 引用类型
    // 取值参考 settings/metadata.js 中 metadataReferenceTypes
    type: {
      type: String,
      required: true,
    },
    // 引用类型对应的内容
    content: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const fundingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    doi: {
      type: String,
      default: '',
    },
    awardNumber: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const mulTextSchema = new mongoose.Schema(
  {
    lang: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const authorSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    uid: {
      type: String,
      default: '',
    },
    orcid: {
      type: String,
      default: '',
    },
    // 所属机构
    affiliation: {
      type: String,
      default: '',
    },
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    // 来源
    // 取值参考 settings/metadata.js 中 metadataSources
    source: {
      type: String,
      required: true,
      index: 1,
    },
    // 来源ID
    sid: {
      type: String,
      required: true,
      index: 1,
    },
    // 当前文档创建时间
    toc: {
      type: Date,
      required: true,
      index: 1,
    },
    // 提交时间
    applydAt: {
      type: Date,
      default: null,
    },
    // 成功注册的时间
    registerdAt: {
      type: Date,
      default: null,
    },
    // doi状态
    // 取值参考 settings/metadata.js 中 metadataDOIStatus
    doiStatus: {
      type: String,
      required: true,
      index: 1,
    },
    // 资助机构
    funders: {
      type: [fundingSchema],
      default: [],
    },
    // 参考
    references: {
      type: [referencesSchema],
      default: [],
    },
    // 标题
    titles: {
      type: [mulTextSchema],
      required: true,
    },
    // 摘要
    abstract: {
      type: [mulTextSchema],
      required: true,
    },
    // 关键词
    keywords: {
      type: [mulTextSchema],
      default: [],
    },
    // 贡献人
    authors: {
      type: [authorSchema],
      default: [],
    },
  },
  {
    collection: 'metadata',
  },
);
