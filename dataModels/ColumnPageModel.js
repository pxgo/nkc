const mongoose = require("../settings/database");
const Schema = mongoose.Schema;
const schema = new Schema({
  _id: Number,
  columnId: {
    type: String,
    required: true,
    index: 1
  },
  hidden: {
    type: Boolean,
    default: false
  },
  l: {
    type: String,
    default: "json"
  },
  t: {
    type: String,
    default: ""
  },
  c: {
    type: String,
    required: true
  },
  toc: {
    type: Date,
    default: Date.now,
    index: 1
  },
  tlm: {
    type: Date,
    default: null
  },
  asHome: {
    type: Boolean,
    default: false,
    index: 1
  }
}, {
  collection: "columnPages"
});
// 记录引用资源的专栏独立页面
schema.pre("save", async function(next) {
  const id = `column-${this._id}`;
  const ResourceModel = mongoose.model("resources");
  if (this.l === 'json') {
    await ResourceModel.toReferenceSourceByJson(id, this.c);
  } else {
    await ResourceModel.toReferenceSource(id, this.c);
  }
  await next();
});

/*
* 更新搜索数据库中的数据
* */
schema.statics.toSearch = async (pageId) => {
  const page = await mongoose.model("columnPages").findOne({_id: pageId});
  if(!page) throwErr(404, `未找到ID为${pageId}的专栏自定义页`);
  const data = {
    tid: page._id,
    t: page.t,
    c: page.c,
    toc: page.toc,
    l: page.l,
  };
  const es = require("../nkcModules/elasticSearch");
  await es.save("columnPage", data);
};
module.exports = mongoose.model("columnPages", schema);