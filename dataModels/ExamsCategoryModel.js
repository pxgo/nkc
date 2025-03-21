const settings = require('../settings');
const mongoose = settings.database;
const Schema = mongoose.Schema;
const examCategoryTypes = { secret: 'secret', public: 'public' };
const schema = new Schema(
  {
    _id: Number,
    disabled: {
      // 是否屏蔽该试卷
      type: Boolean,
      default: false,
      index: 1,
    },
    level: {
      type: Number,
      default: 1, // 1: 基础级， 2: 专业级
    },
    // 表示试卷是A卷还是B卷还是入学培训
    // 这跟QuestionModel上的volume有所不同，QuestionModel上的volume相当于level，表示试题的难度
    volume: {
      type: String,
      default: 'A', // A: A卷考试, B: B卷考试, AD: 入学培训
    },
    //闭卷考试是必带uid，但是开卷考试用户并没有uid
    uid: {
      type: String,
      required: true,
    },
    order: {
      // 考卷排序
      type: Number,
      default: 1,
      index: 1,
    },
    toc: {
      type: Date,
      default: Date.now,
      index: 1,
    },
    name: {
      // 考卷名称
      type: String,
      required: true,
    },
    description: {
      // 考卷介绍
      type: String,
      default: '',
    },
    passScore: {
      // 及格分数
      type: Number,
      default: 10,
    },
    time: {
      // 考试时间
      type: Number,
      default: 30, // 默认考试时间为30分钟
    },
    rolesId: {
      // 通过后颁发的证书
      type: [String],
      default: [],
    },
    from: {
      type: [
        {
          // 试题来源的标签ID
          tag: {
            type: Number,
            index: 1,
            require: true,
          },
          // 抽取试题的道数
          count: {
            type: Number,
            default: 1,
          },
        },
      ],
    },
    type: {
      type: String,
      default: examCategoryTypes.secret,
      required: true,
    },
    /*from: {
      // 考卷试题来源
      type: Schema.Types.Mixed,
      default: [],
    },*/
    /* from: [
    {
      type: { // pub: public, pro: professional
        type: String,
        required: true
      },
      fid: { // 专业ID
        type: String,
        default: ''
      },
      count: { // 从该专业抽取试题的数量
        type: Number,
        default: 1
      }
    }
  ], */
  },
  {
    collection: 'examsCategories',
  },
);
schema.statics.getExamCategoryTypes = async () => {
  return { ...examCategoryTypes };
};
module.exports = mongoose.model('examsCategories', schema);
