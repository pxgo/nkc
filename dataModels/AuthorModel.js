const mongoose = require('../settings/database');
const schema = new mongoose.Schema(
  {
    toc: {
      type: Date,
      required: true,
      index: 1,
    },
    uid: {
      type: String,
      required: true,
      index: 1,
    },
    familyName: {
      type: String,
      required: true,
    },
    givenName: {
      type: String,
      required: true,
    },
    orcid: {
      type: String,
      default: '',
    },
    kcid: {
      type: String,
      default: '',
    },
    // 是否显示联系方式
    contact: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      default: '',
    },
    tel: {
      type: String,
      default: '',
    },
    postalCode: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    // 所属机构名称
    agencyName: {
      type: String,
      default: '',
    },
    // 所属机构 DOI 号
    agencyDOI: {
      type: String,
      default: '',
    },
    // 所属机构地址
    agencyAddress: {
      type: String,
      default: '',
    },
  },
  {
    collection: 'authors',
  },
);

module.exports = mongoose.model('authors', schema);
