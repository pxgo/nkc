const { settingIds } = require('../../settings/serverSettings');
module.exports = {
  _id: settingIds.post,
  c: {
    postToForum: {
      authLevelMin: 0,
      exam: {
        volumeA: true,
        volumeB: true,
        notPass: {
          status: true,
          countLimit: 5,
          unlimited: true,
        },
      },
      anonymous: {
        status: false,
        defaultCertGradesId: [],
        rolesId: [],
        uid: [],
      },
      survey: {
        status: false,
        defaultCertGradesId: [],
        deadlineMax: 30,
        ignoredRolesId: [],
        rolesId: [],
        uid: [],
      },
      // 原创申明 字数最小值
      originalWordLimit: 500,
      // 专业分类辅分类数量
      minorForumCount: {
        min: 0,
        max: 1,
      },
    },
    postToThread: {
      authLevelMin: 0,
      exam: {
        volumeA: true,
        volumeB: true,
        notPass: {
          status: true,
          unlimited: true,
          countLimit: 5,
        },
      },
      anonymous: {
        status: false,
        defaultCertGradesId: [],
        rolesId: [],
        uid: [],
      },
      survey: {
        status: false,
        defaultCertGradesId: [],
        rolesId: [],
        deadlineMax: 30,
        ignoredRolesId: [],
        uid: [],
      },
    },
  },
};
