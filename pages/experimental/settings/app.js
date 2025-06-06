const logs = window.NKC.methods.getDataById('data').logs;
const CommonModal = new window.NKC.modules.CommonModal();
import { getDataById } from '../../lib/js/dataConversion';
import {
  sweetQuestion,
  sweetError,
  sweetSuccess,
} from '../../lib/js/sweetAlert';
import { nkcAPI } from '../../lib/js/netAPI';
const appStoreWarning =
  '仅会推送新版本介绍（非应用程序），用户只能借助应用市场升级应用程序。勾选前，请确保新版应用程序已上传至目标平台。';
const appStoresNames = {
  GooglePlay: 'Google Play',
  iOSAPPStore: 'iOS APP Store',
};

const { appStores } = getDataById('data');
function setStable(hash, type) {
  sweetQuestion('确定要执行当前操作？')
    .then(function () {
      nkcAPI('/e/settings/app', 'PUT', {
        operation: 'modifyStable',
        hash: hash,
        stable: !!type,
      })
        .then(function () {
          sweetSuccess('修改成功');
          window.location.reload();
        })
        .catch(sweetError);
    })
    .catch(function () {});
}

function setDisabled(hash, type) {
  sweetQuestion('确定要执行当前操作？')
    .then(function () {
      nkcAPI('/e/settings/app', 'PUT', {
        operation: 'modifyDisabled',
        hash: hash,
        disabled: !!type,
      })
        .then(function () {
          sweetSuccess('修改成功');
          window.location.reload();
        })
        .catch(sweetError);
    })
    .catch(function () {});
}
function edit(hash) {
  var log;
  for (var i = 0; i < logs.length; i++) {
    if (logs[i].hash === hash) {
      log = logs[i];
      break;
    }
  }
  if (!log) {
    return;
  }
  CommonModal.open(
    function (data) {
      nkcAPI('/e/settings/app', 'PUT', {
        operation: 'modifyVersion',
        hash: hash,
        version: data[0].value,
        description: data[1].value,
        appStores: data[2].value,
      })
        .then(function () {
          CommonModal.close();
          sweetSuccess('修改成功');
          window.location.reload();
        })
        .catch(sweetError);
    },
    {
      title: '修改版本信息',
      data: [
        {
          dom: 'input',
          label: '版本号',
          value: log.appVersion,
        },
        {
          dom: 'textarea',
          label: '更新说明',
          disabledKeyup: true,
          value: log.appDescription,
        },
        {
          dom: 'checkbox',
          label: `推送到应用商店`,
          warning: appStoreWarning,
          checkboxes: Object.values(appStores).map((item) => {
            return {
              _id: item,
              name: appStoresNames[item] || item,
              disabled: item === appStores.iOSAPPStore,
            };
          }),
          value: log.appStores,
        },
      ],
    },
  );
}

if (window.$('#app').length) {
  var app = new window.Vue({
    el: '#app',
    data: {
      version: '',
      description: '',
      submitting: false,
      progress: 0,
      appPlatForm: 'android',
      appStores: [],
      originAppStores: appStores,
      appStoresNames: appStoresNames,
      appStoreWarning,
    },
    computed: {
      appStoresTypes: () => {
        return Object.keys(appStores);
      },
    },
    methods: {
      submit: function () {
        var self = this;
        Promise.resolve()
          .then(function () {
            if (!self.appPlatForm) {
              throw '请选择平台';
            }
            if (!self.version) {
              throw '请输入版本号';
            }
            if (!self.description) {
              throw '请输入更新说明';
            }
            var appInput = document.getElementById('appInput');
            if (!appInput.files.length) {
              throw '请选择安装包';
            }
            var file = appInput.files[0];
            var formData = new FormData();
            formData.append('file', file);
            formData.append('appPlatform', self.appPlatForm);
            formData.append('appVersion', self.version);
            formData.append('appDescription', self.description);
            self.submitting = true;
            return window.nkcUploadFile(
              '/e/settings/app',
              'POST',
              formData,
              function (e, progress) {
                self.progress = progress;
              },
            );
          })
          .then(function () {
            self.submitting = false;
            sweetSuccess('发布成功');
          })
          .catch(function (data) {
            sweetError(data);
            self.submitting = false;
          });
      },
    },
  });
}
/*

var CommonModal = new NKC.modules.CommonModal();
var data = NKC.methods.getDataById("data");
var app = new Vue({
  el: '#app',
  data: {
    progress: 0,
    data: data
  },
  methods: {
    changeDownLoadState: function (item) {
      var newVersion = JSON.parse(JSON.stringify(item));
      newVersion.canDown = !newVersion.canDown;
      nkcAPI('/e/settings/app/histories', 'PUT', { newVersion: newVersion, operating: 'changeState' })
        .then(function (res) {
          item.canDown = !item.canDown;
          return sweetSuccess('修改成功！');
        }).catch(function (err) {
          return sweetError(err);
        });
    },
    setStable: function (item) {
      var that = this;
      var newVersion = JSON.parse(JSON.stringify(item));
      newVersion.stable = true;
      nkcAPI('/e/settings/app/histories', 'PUT', { newVersion: newVersion, operating: 'setStable' })
        .then(function (res) {
          that.data.histories.forEach(function (ele) {
            ele.stable = false;
          });
          item.stable = true;
          return sweetSuccess('修改成功！');
          // location.reload();
        }).catch(function (err) {
          return sweetError(err);
        });
    },
    updateVersion: function (item) {
      CommonModal.open(function (data) {
        if (!data[0].value) return screenTopAlert("请输入版本号！");
        if (!data[1].value) return screenTopAlert("请输入更新内容！");
        var newVersion = JSON.parse(JSON.stringify(item));
        newVersion.appVersion = data[0].value;
        newVersion.appDescription = data[1].value;
        nkcAPI('/e/settings/app/histories', 'PUT', { newVersion: newVersion, operating: 'updateVersion' })
          .then(function (res) {
            return sweetSuccess('修改成功！');
            // location.reload();
          }).catch(function (err) {
            return sweetError(err);
          });
      }, {
          title: "修改版本信息",
          data: [
            {
              dom: "input",
              label: "版本号",
              value: item.appVersion
            },
            {
              dom: "textarea",
              label: "更新内容",
              value: item.appDescription
            }
          ]
        });
    },
    submitApp: function () {
      var that = this;
      geid('submitApp').disabled = true;
      var platform = $('#platform').val();
      var version = $('#version').val();
      var description = $('#description').val();
      var toc = new Date().getDate();
      if (!version) {
        geid('submitApp').disabled = false;
        return sweetError("请输入版本号！");
      }
      if (!description) {
        geid('submitApp').disabled = false;
        return sweetError("请输入更新内容！");
      }
      var file = geid('appfile').files;
      if (!file.length) {
        geid("submitApp").disabled = false;
        return sweetError("请选择一个安装包！");
      } else if (file[0].type !== 'application/vnd.android.package-archive') {
        geid("submitApp").disabled = false;
        return sweetError("文件格式必须为apk ！");
      }
      var formData = new FormData();
      formData.append("file", file[0]);
      formData.append("appPlatform", platform);
      formData.append("appVersion", version);
      formData.append("appDescription", description);
      formData.append("appToc", toc);
      uploadFilePromise("/e/settings/app/upload", formData, function (e, p) {
        that.progress = p;
      })
        .then(function (data) {
          geid('submitApp').disabled = false;
          return sweetSuccess('上传成功！');
        })
        .catch(function (data) {
          that.progress = 0;
          sweetError(data.error || data);
          geid('submitApp').disabled = false;
        });
    }
  }
});
*/

Object.assign(window, {
  logs,
  CommonModal,
  setStable,
  setDisabled,
  edit,
});
