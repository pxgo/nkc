import { getDataById } from '../../../lib/js/dataConversion';
import { nkcAPI } from '../../../lib/js/netAPI';
import { sweetSuccess, sweetError } from '../../../lib/js/sweetAlert';

const data = getDataById('data');
let hash = window.location.hash;
let defaultSourceType = 'article';
if (hash) {
  hash = hash.replace('#', '');
  if (data.publishSettings[hash]) {
    defaultSourceType = hash;
  }
}
const app = new window.Vue({
  el: '#app',
  data: {
    publishSettings: data.publishSettings,
    sources: data.sources,
    selectSourceType: defaultSourceType,
    roleList: data.roleList,
    keywordsGroup: data.keywordsGroup,
    nationCodes: window.nationCodes,
  },
  computed: {
    settings() {
      return this.publishSettings[this.selectSourceType] || null;
    },
    canNotPublishMoment() {
      return this.selectSourceType === 'moment' &&
        this.settings.postPermission.momentCount.limited &&
        this.settings.postPermission.examNotPass.status === false
        ? '当前设置会导致永远无权发表电文'
        : '';
    },
    mustSelectOneExam() {
      return this.settings.postPermission.examEnabled &&
        !this.settings.postPermission.examVolumeA &&
        !this.settings.postPermission.examVolumeB &&
        !this.settings.postPermission.examVolumeAD
        ? '请至少勾选一种考试'
        : '';
    },
  },
  methods: {
    selectSource(type) {
      this.selectSourceType = type;
      window.location.hash = type;
    },
    addItem(arr) {
      arr.push({
        valueString: '',
        limited: false,
        interval: 0,
        count: 0,
      });
    },
    addReviewItem() {
      this.settings.postReview.blacklist.push({
        valueString: '',
        type: 'none',
        count: 1,
      });
    },
    removeItem(arr, index) {
      arr.splice(index, 1);
    },
    submit() {
      const { publishSettings } = this;
      if (this.canNotPublishMoment) {
        return sweetError(this.canNotPublishMoment);
      }
      if (this.mustSelectOneExam) {
        return sweetError(this.mustSelectOneExam);
      }
      nkcAPI('/e/settings/publish', 'PUT', { publishSettings })
        .then(() => {
          sweetSuccess(`保存成功`);
        })
        .catch(sweetError);
    },
  },
});
