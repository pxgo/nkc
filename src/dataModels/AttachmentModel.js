const mongoose = require('../settings/database');
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    // 附件ID mongoose.Types.ObjectId().toString()
    _id: String,
    // 附件类型
    type: {
      // userAvatar, userBanner,
      // userAvatarAudit, userBannerAudit,userHomeBannerAudit
      // forumBanner, forumLogo
      // columnAvatar, columnBanner,
      // homeBigLogo,
      // postCover,
      // problemImage,
      // recommendThreadCover,
      // fundAvatar, fundBanner
      // scoreIcon, bookCover, articleCover
      // authorPhoto
      type: String,
      required: true,
      index: 1,
    },
    // 附件拥有者ID
    uid: {
      type: String,
      default: '',
      index: 1,
    },
    // 附件目录 不包含文件名
    path: {
      type: String,
      default: '',
      index: 1,
    },
    // 创建时间
    toc: {
      type: Date,
      default: Date.now,
      index: 1,
    },
    // 附件大小
    size: {
      type: Number,
      default: 0,
    },
    // 附件格式
    ext: {
      type: String,
      required: true,
      index: 1,
    },
    // 附件原文件名
    name: {
      type: String,
      default: '',
    },
    // 附件hash
    hash: {
      type: String,
      index: 1,
      default: '',
    },
    //
    c: {
      type: String,
      default: '',
      index: 1,
    },
    files: {
      def: Schema.Types.Mixed,
      sm: Schema.Types.Mixed,
      lg: Schema.Types.Mixed,
      md: Schema.Types.Mixed,
      /*
    {
      ext: String,
      hash: String, // 文件 md5
      size: Number, // 文件大小
      height: Number, // 图片、视频高
      width: Number,  // 图片、视频宽
      name: String, // 在存储服务磁盘上的文件名
      duration: Number, // 音视频时长
      mtime: Date, // 最后修改时间
    }
    */
    },
    // 附件是否被屏蔽
    disabled: {
      type: Boolean,
      default: false,
      index: 1,
    },
  },
  {
    collection: 'attachments',
  },
);

module.exports = mongoose.model('attachments', schema);
