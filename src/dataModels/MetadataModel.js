// post, document 对应的元数据
const mongoose = require('../settings/database');

// 引用文献
const referencesSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: '',
    },
    doi: {
      type: String,
      default: '',
    },
  },
  { _id: false },
);

// 资助机构
const fundingSchema = new mongoose.Schema(
  {
    // 名称
    name: {
      type: String,
      required: true,
    },
    // 机构doi
    doi: {
      type: String,
      default: '',
    },
    // 资助项目编号
    awardCode: {
      type: [String],
      default: [],
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
    kcid: {
      type: String,
      default: '',
    },
    orcid: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    tel: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    agencyName: {
      type: String,
      default: '',
    },
    agencyDOI: {
      type: String,
      default: '',
    },
    agencyAddress: {
      type: String,
      default: '',
    },
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    lang: {
      type: String,
      required: true,
      index: 1,
    },
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
    tlm: {
      type: Date,
      default: null,
    },
    // 提交时间
    appliedAt: {
      type: Date,
      default: null,
    },
    // 成功注册的时间
    registeredAt: {
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
    title: {
      type: String,
      default: '',
    },
    // 摘要
    abstract: {
      type: String,
      required: '',
    },
    // 关键词
    keywords: {
      type: [String],
      default: [],
    },
    // 贡献人
    authors: {
      type: [authorSchema],
      default: [],
    },
    // 文章说明
    description: {
      type: String,
      default: '',
    },
  },
  {
    collection: 'metadata',
  },
);

module.exports = mongoose.model('metadata', schema);
