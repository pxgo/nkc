const settings = require('../settings');
const mongoose = settings.database;
const Schema = mongoose.Schema;

const fundDocumentTypes = {
  project: 'project',
  comment: 'comment',
  userInfoAudit: 'userInfoAudit',
  projectAudit: 'projectAudit',
  moneyAudit: 'moneyAudit',
  adminAudit: 'adminAudit',
  report: 'report',
  system: 'system',
  vote: 'vote',
  reportAudit: 'reportAudit',
  completedAudit: 'completedAudit',
  completedReport: 'completedReport',
  remittance: 'remittance',
  refuse: 'refuse',
  cancelRefuse: 'cancelRefuse',
};

const documentSchema = new Schema(
  {
    _id: Number,
    applicationFormId: {
      // 基金
      type: Number,
      default: null,
      index: 1,
    },
    toc: {
      type: Date,
      default: Date.now,
      index: 1,
    },
    tlm: {
      type: Date,
    },
    type: {
      // project, comment, userInfoAudit, projectAudit, moneyAudit, adminAudit, report, system,  vote, reportAudit, completedAudit, remittance
      type: String,
      required: true,
      index: 1,
    },
    hasImage: {
      type: Boolean,
      default: false,
      index: 1,
    },
    uid: {
      type: String,
      required: true,
      index: 1,
    },
    support: {
      type: Boolean,
      default: null,
      index: 1,
    },
    l: {
      //pwbb
      type: String,
      default: 'json',
    },
    t: {
      type: String,
      default: null,
      maxlength: [200, '标题不能超过50字。'],
    },
    abstract: {
      type: String,
      default: null,
      maxlength: [1000, '摘要不能超过200字。'],
    },
    // 中文摘要
    abstractCn: {
      type: String,
      default: '',
    },
    // 英文摘要
    abstractEn: {
      type: String,
      default: '',
    },
    // 中文关键词
    keyWordsCn: {
      type: Array,
      default: [],
    },
    // 英文关键词
    keyWordsEn: {
      type: Array,
      default: [],
    },
    c: {
      type: String,
      default: '',
      maxlength: [100000, '内容不能超过2万字。'],
    },
    disabled: {
      type: Boolean,
      default: false,
      index: 1,
    },
    reply: {
      type: Number,
      default: null,
      index: 1,
    },
  },
  {
    collection: 'fundDocuments',
    toObject: {
      getters: true,
      virtuals: true,
    },
  },
);

documentSchema
  .virtual('user')
  .get(function () {
    return this._user;
  })
  .set(function (user) {
    this._user = user;
  });

documentSchema
  .virtual('resources')
  .get(function () {
    return this._resources;
  })
  .set(function (resources) {
    this._resources = resources;
  });

documentSchema.pre('save', function (next) {
  try {
    if (!this.tlm) {
      this.tlm = this.toc;
    }
    return next();
  } catch (e) {
    return next(e);
  }
});

documentSchema.statics.getFundDocumentTypes = () => {
  return {
    ...fundDocumentTypes,
  };
};

documentSchema.methods.extendUser = async function () {
  const UserModel = require('./UserModel');
  const user = await UserModel.findOnly({ uid: this.uid });
  return (this.user = user);
};

documentSchema.methods.extendResources = async function () {
  const ResourceModel = require('./ResourceModel');
  const resources = await ResourceModel.find({
    references: `fund-${this._id}`,
  });
  return (this.resources = resources);
};

documentSchema.pre('save', async function (next) {
  const ResourceModel = mongoose.model('resources');
  if (this.l === 'json') {
    await ResourceModel.toReferenceSourceByJson(
      `fund-${this._id}`,
      this.c || '',
    );
  } else {
    await ResourceModel.toReferenceSource(`fund-${this._id}`, this.c || '');
  }
  return next();

  /*try {

		const oldDocument = await FundDocumentModel.findOne({_id: this.id});
		let oldResources = [];
		if(oldDocument) {
			oldDocument.c = oldDocument.c || '';
			oldResources = (oldDocument.c.match(/{r=[0-9]{1,20}}/g) || [])
				.map(str => str.replace(/{r=([0-9]{1,20})}/, '$1'));
		}
		const c = this.c || '';
		this.hasImage = false;
		const newResources = (c.match(/{r=[0-9]{1,20}}/g) || [])
			.map(str => str.replace(/{r=([0-9]{1,20})}/, '$1'));
		const additional = newResources.filter(e => oldResources.indexOf(e) === -1);
		const removed = oldResources.filter(e => newResources.indexOf(e) === -1);
		for(let rid of removed) {
			const resource = await ResourceModel.findOne({rid});
			if(resource) {
				const index = resource.references.indexOf(`fund-${this._id}`);
				if(index !== -1) {
					resource.references.splice(index, 1);
					await resource.save();
				}
			}
		}
		for(let rid of additional) {
			const resource = await ResourceModel.findOne({rid});
			if(resource) {
				if (['jpg', 'jpeg', 'bmp', 'gif', 'svg', 'png'].includes(resource.ext.toLowerCase())) {
					this.hasImage = true;
				}
				if(!resource.references.includes(`fund-${this._id}`)){
					resource.references.push(`fund-${this._id}`);
					await resource.save();
				}
			}
		}
		return next();
	} catch(err) {
		return next(err);
	}*/
});

documentSchema.statics.extendUFundDocumentInfo = async function (funds) {
  const FundDocumentModel = mongoose.model('fundDocuments');
  const { getUrl } = require('../nkcModules/tools');
  const applicationsIds = [];
  for (const f of funds) {
    applicationsIds.push(f._id);
  }
  const fundDocuments = await FundDocumentModel.find({
    applicationFormId: { $in: applicationsIds },
    type: 'project',
  });
  const fundDocumentObj = {};
  for (const f of fundDocuments) {
    const { t, toc } = f;
    fundDocumentObj[f.applicationFormId] = {
      t,
      url: getUrl('fundApplicationForm', f.applicationFormId),
      toc,
    };
  }
  const results = [];
  for (const f of funds) {
    results.push(fundDocumentObj[f._id]);
  }
  return results;
};

const FundDocumentModel = mongoose.model('fundDocuments', documentSchema);
module.exports = FundDocumentModel;
