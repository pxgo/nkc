<template lang="pug">
  .post-panel
    .account-nav-middle.hidden
      .nav.p-t-1
        span(@click="toRoute('moment')" :class="{'active': $route.name === 'moment'}") 动态
        span(@click="toRoute('post')" :class="{'active': $route.name === 'post'}") 论坛
        span(@click="toRoute('column')" :class="{'active': $route.name === 'column'}") 专栏
    .post-panel-item
      router-view
</template>
<style lang="less" scoped>
@import "../../../../publicModules/base";
@media (min-width: 992px) {
  .account-nav-middle{
    display: none;
  }
}
@media (max-width: 992px) {
  .account-nav-middle{
    display: block;
  }
}
.post-panel {
  padding: 0;
  .account-nav-middle {
    .nav {
      width: 100%;
      text-align: center;
      span {
        padding:0.5rem 2rem 0.5rem 2rem;
        font-size: 1.5rem;
      }
      .active {
        color: #2b90d9;
      }
    }
  }
}
</style>
<script>
import {getState} from "../../../../lib/js/state";
import {routerName} from "../../../routes/user";
export default {
  data:() => ({
    uid: '',
    t: null,
    momentsData: null,
    posts: null,
    users: [],
    paging: null,
  }),
  mounted() {
    const {params, name} = this.$route;
    const {uid} = params;
    this.uid = uid;
    this.t = name;
  },
  methods: {
    //跳转到指定路由
    toRoute(name) {
      this.t = name;
      this.$router.push({
        name
      });
    },
  }
}
</script>
