const mongoose = require('mongoose');
const { getUrl, fromNow } = require('../nkcModules/tools');
const videoSize = require('../settings/video');
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    nid: {
      type: String,
      unique: true,
      required: true,
    },
    pid: {
      type: String,
      required: true,
      index: 1,
    },
    noticeContent: {
      type: String,
      required: true,
    },
    toc: {
      type: Date,
      default: Date.now,
      index: 1,
    },
    uid: {
      type: String,
      required: true,
      index: 1,
    },
    status: {
      type: String,
      default: 'normal',
    },
    cv: {
      type: Number,
      index: 1,
      default: null,
    },
  },
  { collection: 'newNotices' },
);

schema.statics.extendNoticeContent = async ({ pid, uid, noticeContent }) => {
  const NewNoticesModel = mongoose.model('newNotices');
  const SettingModel = mongoose.model('settings');
  const nid = await SettingModel.operateSystemID('newNotices', 1);
  const noticeObj = {
    nid,
    pid,
    uid,
    noticeContent,
  };
  const newNotice = new NewNoticesModel(noticeObj);
  return await newNotice.save();
};

module.exports = mongoose.model('newNotices', schema);