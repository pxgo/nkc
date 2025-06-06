<template lang="pug">
  .donation(v-if="donation")
    h3.m-b-1.text-center 赞助{{fundName}}
    h5 赞助对象
    .donation-list
      .donation-fund(v-for='t in targets')
        span(:class="{'active': t.type === fundId}" @click='selectFund(t.type)') {{t.name}}
    h5 赞助金额
    .donation-list
      .donation-money(v-for='m in donation.defaultMoney')
        span(:class="{'active': money === m}" @click='selectMoney(m)') {{m / 100}} 元
      .donation-money
        span(:class="{'active': !!inputMoney}" @click='toInputNumber') 自定义
    .m-t-05.m-b-1(v-if='!!inputMoney')
      h5 请输入赞助金额 （元，{{donation.min / 100}} 到 {{donation.max / 100}} 之间）：
      input.form-control(type='text' v-model.number='customMoney' placeholder='请输入赞助金额' @change='formatInputMoney')
    h5 付款方式
    .donation-list
      .donation-pay(v-for='p in payment')
        span(:class="{'active': paymentType === p.type}" @click='selectPaymentType(p.type)') {{p.name}}
    .payment-info
      span(v-if="fee !== 0") 服务商（非本站）将收取 {{fee * 100}}% 的手续费
      h4 支付金额：
        strong {{realMoney / 100}}
        | &nbsp;元
      h4 手续费：
        strong {{feeMoney / 100}}
        | &nbsp;元
      h4
        span 实际到账金额：
        strong &nbsp;{{totalMoney / 100}}&nbsp;
        | &nbsp;元
    .checkbox.m-t-05
      label
        input(type='checkbox' :value='true' v-model='anonymous')
        span 匿名赞助

    .m-t-1.m-b-1
      button.payment-button(v-if='!donation.enabled' disabled) 赞助功能已关闭
      button.payment-button(v-else-if='submitting' disabled) 提交中
      button.payment-button(v-else-if='exceedsMaxValue' disabled) 单次支付金额不能超过 {{donation.max / 100}} 元
      button.payment-button(v-else @click='submit') 提交
    .payment-description {{description}}
</template>

<style lang="less" scoped>
@import '../../publicModules/base';
.donation{
  .donation-list{
    margin: 0 -0.5rem;
    font-size: 0;
  }
  @height: 3rem;
  .donation-money, .donation-fund, .donation-pay{
    width: 25%;
    height: @height;
    line-height: @height;
    padding: 0 0.5rem;
    display: inline-block;
    margin-bottom: 1rem;
    span{
      height: 100%;
      .hideText(@line: 1);
      font-size: 1.2rem;
      border: 1px solid #ddd;
      border-radius: 3px;
      text-align: center;
      cursor: pointer;
      user-select: none;
      &.active{
        color: #fff;
        background-color: @primary;
        border-color: #f4f4f4;
      }
    }
  }
  .payment-info{
    margin: 0.5rem 0 ;
    font-size: 1rem;
    color: #555;
    strong{
      color: @accent;
    }
  }
  .payment-description{
    white-space: pre-wrap;
    color: #555;
  }
  .payment-button{
    height: 3rem;
    width: 100%;
    border: 1px solid @primary;
    background-color: @primary;
    color: #fff;
    border-radius: 3px;
    &:hover, &:active, &[disabled]{
      opacity: 0.7;
    }
    &[disabled] {
      cursor: not-allowed;
    }
  }
}
</style>

<script>
import { getState } from '../../lib/js/state';
export default {
  props: ['fund', 'inimoney', 'refund'],
  data: () => ({
    donation: null,
    funds: [],
    money: null,
    fundId: null,
    paymentType: null,
    inputMoney: false,
    customMoney: null,
    submitting: false,
    anonymous: false,
    description: '',
    fundName: ''
  }),
  mounted() {
    this.initData();
  },
  computed: {
    targets() {
      const {funds} = this;
      const arr = [
        {
          name: '资金池',
          type: 'fundPool'
        }
      ];
      for(const f of funds) {
        arr.push({
          name: f.name,
          type: f._id
        });
      }
      return arr;
    },
    payment() {
      const {aliPay, wechatPay} = this.donation.payment;
      const arr = [];
      if (aliPay.enabled) {
        arr.push({
          type: 'aliPay',
          name: '支付宝'
        });
      }
      if(wechatPay.enabled) {
        arr.push({
          type: 'wechatPay',
          name: '微信'
        });
      }
      return arr;
    },
    fee() {
      const {payment} = this.donation;
      const {paymentType} = this;
      const paymentData = payment[paymentType];
      if(!paymentData) return null;
      return paymentData.fee;
    },
    realMoney() {
      const {money, inputMoney, customMoney} = this;
      if(inputMoney) {
        return Math.ceil(customMoney * 100);
      } else {
        return money;
      }
    },
    totalMoney() {
      const {realMoney, feeMoney} = this;
      if(feeMoney === null) return null;
      return Math.ceil(realMoney - feeMoney);
    },
    feeMoney() {
      const {realMoney, fee} = this;
      if(fee === null) return null;
      return Math.ceil(realMoney * fee);
    },
    paymentInfo() {
      const {totalMoney, fee} = this;
      if(totalMoney === null) return '';
      return `服务商（非本站）将收取 ${fee * 100}% 的手续费，实际支付金额为 <strong>${totalMoney / 100}</strong> 元`;
    },
    exceedsMaxValue() {
      return this.realMoney > this.donation.max;
    }
  },
  methods: {
    getUrl: NKC.methods.tools.getUrl,
    initData() {
      const self = this;
      return nkcAPI('/fund/donation', 'GET')
        .then(data => {
          const {
            donation,
            funds,
            description,
            fundName
          } = data;
          self.donation = donation;
          self.funds = funds;
          self.description = description;
          self.fundName = fundName;
        })
        .then(() => {
          self.selectFund(self.fund || self.targets[0].type);
          if(self.inimoney) {
            self.inputMoney = true;
            self.customMoney = self.inimoney;
          } else {
            self.selectMoney(self.donation.defaultMoney[0]);
          }
          if(self.payment.length > 0) {
            self.selectPaymentType(self.payment[0].type);
          }
        })
        .catch(data => {
          sweetError(data);
        })
    },
    selectFund(fundId) {
      this.fundId = fundId;
    },
    selectMoney(money) {
      this.inputMoney = false;
      this.money = money;
    },
    selectPaymentType(type) {
      this.paymentType = type;
    },
    toInputNumber() {
      this.money = null;
      this.inputMoney = true;
    },
    formatInputMoney() {
      let customMoney = Number(this.customMoney.toFixed(2));
      if(isNaN(customMoney)) customMoney = 0;
      this.customMoney = customMoney;
    },
    submit() {
      this.submitting = true;
      const self = this;
      const {
        realMoney,
        paymentType,
        fee,
        totalMoney,
        donation,
        anonymous,
        fundId,
        refund
      } = this;
      let newWindow = null;
      let apiType = '';
      if(NKC.methods.isPcBrowser()){
        apiType='native';
      }else{
        if(navigator.userAgent.indexOf("MicroMessenger")>0){
          apiType='jsApi';
        }else{
          apiType='H5';
        }
      }
      return Promise.resolve()
        .then(() => {
          if(realMoney < donation.min) {
            throw new Error(`支付金额不能小于 ${donation.min / 100} 元`);
          }
          if(realMoney > donation.max) {
            throw new Error(`支付金额不能大于 ${donation.max / 100} 元`);
          }
          if(
            NKC.methods.isPcBrowser() ||
            NKC.methods.isMobilePhoneBrowser()
          ) {
            newWindow = window.open();
          }
          return nkcAPI('/fund/donation', 'POST', {
            money: realMoney,
            fee,
            apiType,
            paymentType,
            fundId,
            anonymous,
            refund
          });
        })
        .then(res => {
          const {aliPaymentInfo, wechatPaymentInfo} = res;
          if(wechatPaymentInfo) {
            // 判断是否是jsApi支付==》后端已经在数据库创建好一条支付数据，这里直接跳转到微信支付页
            if( apiType==='jsApi'){
              newWindow.location = wechatPaymentInfo.url;
            }else{
              NKC.methods.toPay('wechatPay', wechatPaymentInfo, newWindow);
            }
          } else if(aliPaymentInfo) {
            NKC.methods.toPay('aliPay', aliPaymentInfo, newWindow);
          }
          self.submitting = false;
          sweetInfo('请在浏览器新打开的窗口完成支付！若没有新窗口打开，请检查新窗口是否已被浏览器拦截。');
        })
        .catch(error => {
          self.submitting = false;
          if(newWindow && newWindow.close) newWindow.close();
          sweetError(error);
        });
    }
  }
}
</script>
