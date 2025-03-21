import { strToObj } from '../lib/js/dataConversion';
import { initLongPressEvent } from '../lib/js/longPress';
import {
  openUserFloatPanel,
  closeUserFloatPanel,
  openForumFloatPanel,
  closeForumFloatPanel,
  openStickerPanel,
  openShareFloatPanel,
  openCreditPanel,
  openDownloadPanel,
} from './methods';
import { viewImage, viewImages, viewMedias } from '../lib/js/mediaViewer';
import { getState } from '../lib/js/state';
import {
  longPressImage,
  RNDownloadFile,
  RNOpenNewPageThrottle,
  RNSaveImage,
  RNUrlPathEval,
} from '../lib/js/reactNative';

const state = getState();
const isReactNative = state.isApp && state.platform === 'reactNative';

/*
 * 下载文件
 * @param {Object} data
 *   @param {String} name 文件名称
 *   @param {String} url 文件链接
 * */
function downloadFile(data) {
  const { name, url } = data;
  RNDownloadFile(name, url);
}

/*
 * 保存图片到相册
 * @param {Object}
 *   @param {String} name 图片文件名
 *   @param {String} url 图片链接
 * */
function saveImage(data) {
  const { name, url } = data;
  RNSaveImage(name, url);
}

// APP长按保存图片
function longPressImageForRN(data) {
  longPressImage(data);
}
/*
 * 显示用户悬浮名片
 * */
function showUserPanel(data, dom) {
  const { uid } = data;
  openUserFloatPanel(uid, dom);
}

/*
 * 鼠标移出隐藏用户名片
 * */
function hideUserPanel() {
  closeUserFloatPanel();
}

/*
 *  显示专业名片
 * */
function showForumPanel(data, dom) {
  const { fid } = data;
  openForumFloatPanel(fid, dom);
}

/*
 * 隐藏用户名片
 * */
function hideForumPanel() {
  closeForumFloatPanel();
}

function viewSticker(data) {
  openStickerPanel(data.rid, data.management || false);
}

function showSharePanel(data) {
  const { type, id } = data;
  openShareFloatPanel(type, id);
}

function showCreditPanel(data) {
  const { creditType, contentType, contentId } = data;
  openCreditPanel(creditType, contentType, contentId);
}

/*
 * data-global-click 和 data-global-long-press 合法的操作
 * */
const eventFunctions = {
  viewImage,
  viewImages,
  viewMedias,
  downloadFile,
  saveImage,
  showUserPanel,
  hideUserPanel,
  showForumPanel,
  hideForumPanel,
  viewSticker,
  showSharePanel,
  showCreditPanel,
  openDownloadPanel,
  longPressImageForRN,
}

/*
 * 点击事件、触摸时间触发之后执行的函数，统一处理
 * @param {String} eventType 时间类型 click, long-press, mouseover
 * @param {Event}
 * */
function globalEvent(eventType, e) {
  const element = e.target;
  let elementJQ = window.$(element);
  let operation = elementJQ.attr(`data-global-${eventType}`);
  //获取点击元素的父级元素中包含该属性的元素， 不查找包含该属性的子级
  if (!operation) {
    const doms = elementJQ.parents(`[data-global-${eventType}]`);
    const dom = doms.eq(0);
    const val = dom.attr(`data-global-${eventType}`);
    elementJQ = dom;
    if (val) {
      operation = val;
    }
  }
  if (!operation) {
    return;
  }
  const eventFunction = eventFunctions[operation];
  if (!eventFunction) {
    return;
  }
  let data = elementJQ.attr('data-global-data');
  data = strToObj(data);
  eventFunction(data, elementJQ);
}

/*
 * 监听全局点击事件
 * data-global-click=operation
 * data-global-data='' object json string
 * */
export function initGlobalClickEvent() {
  document.addEventListener('click', (e) => {
    globalEvent('click', e);
  });
}

/*
 * 监听长按事件
 * */
export function initGlobalLongPressEvent() {
  initLongPressEvent(document, (e) => {
    globalEvent('long-press', e);
  });
}

/*
 * 监听鼠标移入移出悬浮事件
 * */
export function initGlobalMouseOverEvent() {
  //鼠标移入
  document.addEventListener('mouseover', (e) => {
    globalEvent('mouseover', e);
  });
  //鼠标移出
  document.addEventListener('mouseout', (e) => {
    globalEvent('mouseout', e);
  });
}

/*
 * APP 监听点击 a 标签
 * */
export function initAppGlobalClickLinkEvent() {
  if (!isReactNative) {
    return;
  }
  // 限流 限制点击链接最小间隔时间为300ms
  // 防止app同时打开多个相同的页面
  const handle = function (e) {
    let element = e.target;
    let elementJQ = window.$(element);
    const tagName = element.nodeName.toLowerCase();
    if (tagName !== 'a') {
      element = elementJQ.parents('a');
      if (element.length === 0) {
        return;
      }
      element = element[0];
      elementJQ = window.$(element);
    }
    const dataType = elementJQ.attr('data-type');
    // 判断是否不需要新窗打开，待改
    if (dataType === 'reload') {
      return;
    }
    const href = elementJQ.attr('href');
    if (!href) {
      return;
    }
    const title = elementJQ.attr('title') || '';
    const targetUrl = RNUrlPathEval(window.location.href, href);
    RNOpenNewPageThrottle(targetUrl, title);
    e.preventDefault();
  };
  document.addEventListener('click', handle);
}
// 暂时针对app默认无法选中文字事件进行重置
export function resetSelectionEvent() {
  if(!isReactNative) return;
  window.document.onselectstart = null;
}
