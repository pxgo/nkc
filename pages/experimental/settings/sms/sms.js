const data = NKC.methods.getDataById("data");
window.app = new Vue({
  el: '#app',
  data: {
    smsSettings: data.smsSettings,
    nationCodes: nationCodes,
    modifyApp: false,
    test: {
      name: 'register',
      mobile: '',
      nationCode: '86',
      content: ""
    }
  },
  methods: {
    checkString: NKC.methods.checkData.checkString,
    saveApp() {
      // 保存AppId、App Key和短信签名
      const {appId, appKey, smsSign, platform} = this.smsSettings;
      const self = this;
      Promise.resolve()
        .then(() => {
          if(!platform) throw '请选择短信平台';
          self.checkString(appId, {
            name: "App ID",
            minLength: 1
          });
          self.checkString(appKey, {
            name: "App Key",
            minLength: 1
          });
          self.checkString(smsSign, {
            name: "短信签名",
            minLength: 1
          });
          const body = {
            type: "modifyApp",
            smsSettings: {
              appId,
              appKey,
              smsSign,
              platform
            }
          };
          return nkcAPI("/e/settings/sms", "PUT", body)
        })
        .then(data => {
          sweetSuccess("保存成功");
        })
        .catch(sweetError);
    },
    getChineseName: function(code) {
      var chineseName = '';
      this.nationCodes.forEach(function (ele) {
        if (ele.code === code) {
          chineseName = ele.chineseName
        }
      });
      return chineseName
    },
    isDisabled: function(nationCode) {
      for (var i=0;  i < this.smsSettings.restrictedNumber.length; i++) {
        if (nationCode === this.smsSettings.restrictedNumber[i].code) return true;
      }
      return false
    },
    addTemplateId(index) {
      this.smsSettings.templates[index].oid.push({
        nationCode: '',
        id: ''
      });
    },
    removeFormArray(arr, index) {
      arr.splice(index, 1);
    },
    tran: function(name) {
      switch (name) {
        case 'register': return '注册';
        case 'login': return '登录';
        case 'getback': return '找回密码';
        case 'bindMobile': return '绑定手机';
        case 'changeMobile': return '更改手机号';
        case 'reset': return '绑定新手机号';
        case 'withdraw': return '提现';
        case 'destroy': return '账号注销';
        case "unbindMobile": return "解绑手机号";
        case 'changeUnusedPhoneNumber': return "更换失效的手机号";
        case 'verifyPhoneNumber': return "定期验证手机号"
      }
    },
    testSendMessage: function() {
      var self = this;
      var name = self.test.name;
      var mobile = self.test.mobile;
      var nationCode = self.test.nationCode;
      var content = self.test.content;
      Promise.resolve()
        .then(() => {
          if(!name) throw('请选择测试类型');
          if(!nationCode) throw('请选择测试手机国际区号');
          if(!mobile) throw('请输入测试手机号码');
          if(!content) throw("请输入自定义验证码");
          return sweetQuestion("确定要发送短消息？")
        })
        .then(() => {
          return nkcAPI('/e/settings/sms/test', 'POST', {name: name, mobile: mobile, nationCode: nationCode, content: content})
        })
        .then(function() {
          sweetSuccess('短信发送成功');
        })
        .catch(sweetError)
    },
    save: function() {
      var smsSettings = this.smsSettings;
      const self = this;
      // 验证限制号码字符串 去掉无用数据 并转为数组
      Promise.resolve()
        .then(function() {
          smsSettings.appId += '';
          const {appId, appKey, smsSign} = smsSettings;
          self.checkString(appId, {
            name: "App ID",
            minLength: 1
          });
          self.checkString(appKey, {
            name: "App Key",
            minLength: 1
          });
          self.checkString(smsSign, {
            name: "短信签名",
            minLength: 1
          });

          for(var i = 0 ; i < smsSettings.templates.length ; i++) {
            var template = smsSettings.templates[i];
            if(smsSettings.status) {
              if(template.id === '') throw(template.name + '的模板ID不能为空');
              for(const o of template.oid) {
                const {nationCode, id} = o;
                if(!nationCode || !id) throw(template.name + '的模板ID不能为空');
              }
              if(template.validityPeriod === '') throw(template.name + '的有效时间不能为空');
              if(template.validityPeriod <= 0) throw(template.name + '的有效时间必须大于0');
              if(template.sameIpOneDay === '') throw(template.name + '的IP次数限制不能为空');
              if(template.sameIpOneDay <= 0) throw(template.name + '的IP次数限制必须大于0');
              if(template.sameMobileOneDay === '') throw(template.name + '的手机号码次数限制不能为空');
              if(template.sameMobileOneDay <= 0) throw(template.name + '的手机号码次数限制必须大于0');
            }
          }

          var checkString = NKC.methods.checkData.checkString;
          smsSettings.restrictedNumber.forEach(function (ele) {
            ele.number = ele.number.toString();
            checkString(ele.code, {
              name: "国际区号",
              minLength: 1,
            });
            checkString(ele.number,{
              name: '受限号码',
              minLength: '1'
            });
            ele.number = ele.number.trim().split(',').filter(function (n) {
              return n.trim();
            })
          })
        })
        .then(function () {
          return nkcAPI('/e/settings/sms', 'PUT', {smsSettings: smsSettings})
        })
        .then(function() {
          sweetSuccess("保存成功");
        })
        .catch(sweetError)
    }
  }
});
