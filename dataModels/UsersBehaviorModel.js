// 关于用户阅读文章、专业等信息的记录
const mongoose = require('../settings/database');
const settings = require('../settings');
const {database} = settings;
const {Schema} = database;

const usersBehaviorSchema = new Schema({
  timeStamp: {
    type: Date,
    default: Date.now,
    index: 1
  },
  uid: {
    type: String,
    default: "",
    // required: true,
    index: 1,
  },
	oldUsername: {
  	type: String,
		index: 1
	},
  toUid: {
    type: String,
    default: "",
    // required: true,
    index: 1
  },
  pid: {
    type: String,
    index: 1
  },
  tid: {
    type: String,
    index: 1,
  },
  fid: {
    type: String,
    index: 1
  },
  mid: {
    type: String,
    index: 1
  },
  toMid: {
    type: String,
    index: 1
  },
  ip: {
    type: String,
    // required: true,
    index: 1
  },
  port: {
    type: String,
    // required: true,
    index: 1
  },
  score: {
    type: Number,
    default: 0,
  },
  isManageOp: {
    type: Boolean,
    default: false,
    index: 1
  },
  operation: {
    type: String,
    // required: true,
    index: 1
  },
  operationId: {
    type: String,
    // required: true,
    index: 1
  },
  type: {
    type: String,
    default: 'unclassified',
    index: 1
  },
  attrChange: {
    name: String,
    change: Number
  }
},
  {
    toObject: {
      getters: true,
      virtuals: true
    },
    collection: 'usersBehaviors'});

usersBehaviorSchema.virtual('actInThread')
  .get(function() {
    return this._actInThread;
  })
  .set(function(n) {
    this._actInThread = n;
  });

usersBehaviorSchema.virtual('thread')
  .get(function() {
    return this._thread;
  })
  .set(function(n) {
    this._thread = n;
  });

usersBehaviorSchema.virtual('oc')
  .get(function() {
    return this._oc;
  })
  .set(function(n) {
    this._oc = n;
  });

usersBehaviorSchema.virtual('post')
  .get(function() {
    return this._post;
  })
  .set(function(n) {
    this._post = n;
  });

usersBehaviorSchema.virtual('forum')
  .get(function() {
    return this._forum;
  })
  .set(function(n) {
    this._forum = n;
  });

usersBehaviorSchema.virtual('myForum')
  .get(function() {
    return this._myForum;
  })
  .set(function(n) {
    this._myForum = n;
  });

usersBehaviorSchema.virtual('toMyForum')
  .get(function() {
    return this._toMyForum;
  })
  .set(function(n) {
    this._toMyForum= n;
  });

usersBehaviorSchema.virtual('user')
  .get(function() {
    return this._user;
  })
  .set(function(n) {
    this._user= n;
  });

usersBehaviorSchema.virtual('toUser')
  .get(function() {
    return this._toUser;
  })
  .set(function(u) {
    this._toUser = u;
  });

usersBehaviorSchema.virtual('link')
  .get(function() {
    return this._link;
  })
  .set(function(u) {
    this._link = u;
  });

usersBehaviorSchema.methods.extendUser = async function() {
  const UserModel = mongoose.model('users');
  let user;
  if(this.uid) {
    const u = await UserModel.findOne({uid: this.uid});
    if(u) {
      user = u;
    }
  }
  return this.user = user;
};

usersBehaviorSchema.methods.extendOperationName = async function(){
	const OperationModel = mongoose.model("operations");
	let operationData;
	if(this.operationId){
		const o = await OperationModel.findOne({_id: this.operationId});
		if(o){
			operationData = o;
		}
	}
	return this.operationData = operationData
}



const UsersBehaviorModel = database.model('usersBehaviors', usersBehaviorSchema, 'usersBehaviors');

module.exports = UsersBehaviorModel;

