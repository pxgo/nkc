function dataURItoBlob (base64Data) {
    var byteString;  
    if (base64Data.split(',')[0].indexOf('base64') >= 0)  
        byteString = atob(base64Data.split(',')[1]);  
    else  
        byteString = unescape(base64Data.split(',')[1]);  
    var mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];  
    var ia = new Uint8Array(byteString.length);  
    for (var i = 0; i < byteString.length; i++) {  
        ia[i] = byteString.charCodeAt(i);  
    }  
    return new Blob([ia], {type: mimeString});  
    }
  
  
  $("document").ready(function(){
    //编辑器缩放
    $(".w-e-text-container").resizable({
      containment: '#body',
      minHeight: 100,
      minWidth: 100,
      maxWidth: 1400
    });
    
    $("#ReplyContent").on("paste", function(){
      return;
      function test(){
        $("#text-elem img").each(function(){
          // 获取当前图片url
          if(!$(this).attr("srcs")){
            return true
          }
          var newSrc = $(this).attr("srcs")
          var ownImage = "<img src='" + newSrc + "'>";
          var isOwnImg = newSrc.indexOf("kechuang");
          if(isOwnImg !== -1){
            $(this).replaceWith(ownImage)
            return true;
          }
          // 使用正在下载图片替换当前图片
          //$(this).attr("src","/resources/site_specific/picupload.png")
          // console.log("newSrc",newSrc)
          // 判断图片是不是系统图片
          var sysimg = new RegExp("file:").test(newSrc)
          // 如果是系统图片，则不向下执行
          if(sysimg == true){
            var elemImg = "<img src='/resources/site_specific/picdefault.png'>"
            $(this).replaceWith(elemImg)
            // console.log("图片无法加载")
            // await $(this).on("error",function(){
            //   var elemImg = "<img src='./picpass.png'>"
            //   $(this).replaceWith(elemImg)
            //   console.log("图片无法加载")
            // })
            return true
          }
          if(newSrc.length > 10){
            var data = {
              loadsrc : newSrc
            }
            // console.log("---------发送url-----------",'\n',newSrc)
            var newimgstr = $(this)
            
            nkcAPI("/download", "POST", data)
            //console.log(fff)
            .then( function(data){
              newimgstr.attr("src","")
              newimgstr.attr("srcs","")
              var newImg = "<img src='" + "/r/" + data.r.rid + "' style='max-width: 100%'>"
              newimgstr.replaceWith(newImg)
              if(list)list.refresh()
            })
            .catch( function(err){
              newimgstr.attr("src","")
              newimgstr.attr("srcs","")
              newimgstr.replaceWith("<img src='/resources/site_specific/picdefault.png'>")
            })
          }
        })
      }
      setTimeout(function(){test()},5000)
      
    })
  })
  
  
  
  function get_selection(the_id) {
    var e = typeof(the_id)=='String'? document.getElementById(the_id) : the_id;
  
    //Mozilla and DOM 3.0
    if('selectionStart' in e)
    {
      var l = e.selectionEnd - e.selectionStart;
      return { start: e.selectionStart, end: e.selectionEnd, length: l, text: e.value.substr(e.selectionStart, l) };
    }
    //IE
    else if(document.selection)
    {
      e.focus();
      var r = document.selection.createRange();
      var tr = e.createTextRange();
      var tr2 = tr.duplicate();
      tr2.moveToBookmark(r.getBookmark());
      tr.setEndPoint('EndToStart',tr2);
      if (r === null || tr === null) return { start: e.value.length, end: e.value.length, length: 0, text: '' };
      var text_part = r.text.replace(/[\r\n]/g,'.'); //for some reason IE doesn't always count the \n and \r in the length
      var text_whole = e.value.replace(/[\r\n]/g,'.');
      var the_start = text_whole.indexOf(text_part,tr.text.length);
      return { start: the_start, end: the_start + text_part.length, length: text_part.length, text: r.text };
    }
    //Browser not supported
    else return { start: e.value.length, end: e.value.length, length: 0, text: '' };
  }
  
  function replace_selection(the_id,replace_str,setSelection) {
    var e = typeof(the_id)==='string'? document.getElementById(the_id) : the_id;
    console.log(e)
    selection = get_selection(the_id);
    var start_pos = selection.start;
    var end_pos = start_pos + replace_str.length;
    e.value = e.value.substr(0, start_pos) + replace_str + e.value.substr(selection.end, e.value.length);
    if(setSelection)set_selection(the_id,end_pos,end_pos);
    return {start: start_pos, end: end_pos, length: replace_str.length, text: replace_str};
  }
  
  function set_selection(the_id,start_pos,end_pos) {
    var e = typeof(the_id)==='string'? document.getElementById(the_id) : the_id;
  
    //Mozilla and DOM 3.0
    if('selectionStart' in e)
    {
      e.focus();
      e.selectionStart = start_pos;
      e.selectionEnd = end_pos;
    }
    //IE
    else if(document.selection)
    {
      e.focus();
      var tr = e.createTextRange();
  
      //Fix IE from counting the newline characters as two seperate characters
      var stop_it = start_pos;
      for (i=0; i < stop_it; i++) if( e.value.charAt(i).search(/[\r\n]/) !== -1 ) start_pos = start_pos - .5;
      stop_it = end_pos;
      for (i=0; i < stop_it; i++) if( e.value.charAt(i).search(/[\r\n]/) !== -1 ) end_pos = end_pos - .5;
  
      tr.moveEnd('textedit',-1);
      tr.moveStart('character',start_pos);
      tr.moveEnd('character',end_pos - start_pos);
      tr.select();
    }
    return get_selection(the_id);
  }
  
  
  function getSearchKV() {
    var search = window.location.search;
    var KVStringArr = search.match(/[\d\w]*=[\d\w\/]*/g);
    var result = {};
    if(KVStringArr)
      for(var i = 0; i < KVStringArr.length; i++) {
        var str = KVStringArr[i];
        var kv = str.split('=');
        var key = kv[0];
        var value = kv[1];
        result[key] = value
      }
    return result
  }
  
  //隐藏html标签
  function blockOnChange(that) {
    return function() {
      var display = 'block';
      var hide = 'none';
      if(that.postController.style.display === display)
        that.postController.style.display = hide;
      else
        that.postController.style.display = display
    }
  }
  
  function threadTypesOnChange(that) {
    return function() {
      var forumsList = that.forumsList;
      var chosenParent = that.parents.value;
      var chosenChild = that.children.value;
      var chosenType = that.threadTypes.value;
      that.threadTypeID = undefined;
      for(var i in forumsList) {
        if(forumsList[i].displayName === chosenParent) {
          var parent = forumsList[i];
          for(var j in parent.children) {
            if(parent.children[j].displayName === chosenChild) {
              var threadTypes = parent.children[j].threadTypes;
              for(var k in threadTypes) {
                if(threadTypes[k].name === chosenType)
                  that.threadTypeID = threadTypes[k].cid;
              }
            }
          }
        }
      }
    }
  }
  
  function childrenOnChange(that) {
    return function() {
      var forumsList = that.forumsList;
      var chosenParent = that.parents.value;
      var chosenChild = that.children.value;
      that.childID = undefined;
      var childNodes = that.threadTypes.childNodes;
      that.threadTypes.value = that.threadTypesDefault;
      for(; childNodes.length > 2;) {
        that.threadTypes.removeChild(childNodes[childNodes.length - 1])
      }
      for(var i in forumsList) {
        if(forumsList[i].displayName === chosenParent) {
          var parent = forumsList[i];
          for(var j in parent.children) {
            var child = parent.children[j];
            if(child.displayName === chosenChild) {
              that.childID = child.fid;
              that.query.type = 'forum';
              var types = child.threadTypes;
              var last = that.threadTypes.lastChild;
              for(var k in types) {
                that.threadTypes.insertBefore(createOption(types[k].name), last)
              }
              that.threadTypes.insertBefore(last, that.threadTypes[0])
            }
          }
        }
      }
      if(!that.childID) {
        screenTopWarning('在当前学院下未找到所选专业,请重新选择.');
      }
    }
  }
  
  function parentsOnChange(that) {
    return function() {
      var value = that.parents.value;
      var forumsList = that.forumsList;
      var children = that.children;
      that.children.value = that.childrenDefault;
      that.parentID = undefined;
      var childNodes = children.childNodes;
      //remove all childNodes except the first one '请选择一个专业'
      for(; childNodes.length > 2;) { //node.childNodes is a live collection.
        //keep the first two & last one elements
        children.removeChild(childNodes[childNodes.length - 1])
      }
      for(var i in forumsList) {
        var parent = forumsList[i];
        if(parent.displayName === value) {
          that.parentID = parent.fid;
          //append new
          var last = children.lastChild;
          for(var j in forumsList[i].children) {
            //console.log('add -> ' +
            children.insertBefore(createOption(forumsList[i].children[j].displayName), last)
            //.innerHTML);
          }
          //把选项 ‘请选择一个专业’ 提到最前面
          children.insertBefore(children.lastChild, children[0]);
        }
      }
    }
  }
  
  //保存草稿
  // function saveDraft(that){
  //   console.log("没反应？")
  //   return function() {
  //     //--获取编辑器的内容--
  //     $(".MathJax_Preview").each(function(){
  //       if($(this).next().next().attr("type").length > 15){
  //         var mathfur = "$$" + $(this).next().next().html() + "$$";
  //       }else{
  //         var mathfur = "$" + $(this).next().next().html() + "$";
  //       }
  //       $(this).next().next().replaceWith(mathfur);
  //       $(this).next().replaceWith("");
  //       $(this).replaceWith("")
  //     })
  //     //-- --
  //     var draftId = $("#draftId").html();
  //     var content = that.content.innerHTML.trim();
  //     var title = that.title.value.trim();
  //     var type = that.query.type;
  //     var cat = that.query.cat;
  //     var id = that.blocked ? that.query.id : that.childID;
  //     var language = that.language.value.toLowerCase().trim();
  //     var emptyContent = content.replace(/<[^>]+>/g,"");
  //     if (emptyContent === '' && type !== 'thread' && type !== 'post' && type !== 'application' && title === '') {
  //       screenTopWarning('请填写内容或标题');
  //       return;
  //     }
  //     if (geid('parseURL').checked) {
  //       if (language === 'markdown') {
  //         content = common.URLifyMarkdown(content);
  //       }
  //       if (language === 'bbcode' || language === 'pwbb') {
  //         content = common.URLifyBBcode(content);
  //       }
  //     }
  //     var post = {
  //       t: title,
  //       c: content,
  //       l: language,
  //       cat: that.threadTypeID,
  //       did: draftId
  //     };
  //     var userId = $("#userNowId").html()
  //     var method = "POST";
  //     var url = "/u/"+userId+"/drafts/";
  //     var data = {post:post};
  //     return nkcAPI(url, method, data)
  //       .then(function (result) {
  //         if(result.status == "success"){
  //           console.log(result.did)
  //           $("#draftId").html(result.did)
  //           jalert("保存成功！");
  //         }
  //         if(result.redirect) {
  //           redirect(result.redirect)
  //         } else {
  //           if(that.type === 'post') {
  //             redirect()
  //           }
  //         }
  //       })
  //       .catch(function (data) {
  //         jwarning(data.error);
  //         geid('post').disabled = false
  //       })
  //   }
  // }
  
  function onPost(that) {
    return function() {
      //--获取编辑器的内容--
      var specialMark = that.specialMark;
      $(".MathJax_Preview").each(function(){
        if($(this).next().next().length !== 0){
          if($(this).next().next().attr("type").length > 15){
            var mathfur = "$$" + $(this).next().next().html() + "$$";
          }else{
            var mathfur = "$" + $(this).next().next().html() + "$";
          }
          $(this).next().next().replaceWith(mathfur);
          $(this).next().replaceWith("");
          $(this).replaceWith("")
        }else{
          $(this).parent().remove()
        }
      })
      var quoteContent = document.getElementById("quoteContent").innerHTML
      if(specialMark == "old"){
        var content = that.content.value;
      }else{
        var content = quoteContent + that.content.innerHTML.trim();
      }
      //-- --
      var title = that.title.value.trim();
      var type = that.query.type;
      var cat = that.query.cat;
      var id = that.blocked ? that.query.id : that.childID;
      var language = that.language.value.toLowerCase().trim();
      if (content === '') {
        screenTopWarning('请填写内容。');
        return;
      }
      if (type !== 'thread' && type !== 'post' && type !== 'application' && title === '') {
        screenTopWarning('请填写标题。');
        return;
      }
      if (geid('parseURL').checked) {
        if (language === 'markdown') {
          content = common.URLifyMarkdown(content);
        }
        if (language === 'bbcode' || language === 'pwbb') {
          content = common.URLifyBBcode(content);
        }
      }
      var post = {
        t: title,
        c: content,
        l: language,
        cat: that.threadTypeID,
        mid: that.query.mid
      };
      if (!that.blocked && (!that.childID)) {
        screenTopWarning('未指定正确的发送目标, 请选择正确的学院 -> 专业');
        return;
      }
      that.post.disabled = true;
      var method;
      var url;
      var data;
      if (type === 'post') {
        method = 'PUT';
        url = '/p/' + id;
        data = {post: post};
      } else if (type === 'forum') {
        method = 'POST';
        url = '/f/' + id;
        data = {post: post};
      } else if (type === 'thread') {
        method = 'POST';
        url = '/t/' + id;
        data = {post: post};
      } else if (type === 'application' && cat === 'p') { // 编辑项目内容
          method = 'PUT';
          url = '/fund/a/' + id;
          data = {project: post, s: 3}
      } else if(type === 'application' && cat === 'c') { // 评论
          method = 'POST';
          url = '/fund/a/' + id + '/comment';
          data = {comment: post}
      } else if(type === 'application' && cat === 'r') { // 报告
          method = 'POST';
          url = '/fund/a/' + id + '/report';
          data = {c: post.c, t: post.t}
      } else if(type === 'redit'){
        method = 'POST';
        url = '/f/' + id;
        data = {post: post};
      } else {
        jwarning('未知的请求类型：'+type);
      }
      return nkcAPI(url, method, data)
        .then(function (result) {
          if(result.redirect) {
            redirect(result.redirect)
          } else {
            if(that.type === 'post') {
              redirect()
            }
          }
        })
        .catch(function (data) {
          jwarning(data.error);
          geid('post').disabled = false
        })
    }
  }
  
  function groupingForums(forumsList) {
    forumsList.sort(function(a, b) {
      return a.order - b.order;
    });
    for(var i in forumsList) {
      if (forumsList[i].children){
        forumsList[i].children.sort(function (a, b) {
          return a.order - b.order;
        })
      }
    }
    return forumsList
  }
  
  function createOption(text) {
    var textNode = document.createTextNode(text);
    var option = document.createElement('option');
    option.appendChild(textNode);
    return option;
  }
  
  function mathfresh(){
      if(MathJax){
          MathJax.Hub.PreProcess(geid('parsedcontent'),function(){MathJax.Hub.Process(geid('parsedcontent'))})
      }
      if(hljs){
          ReHighlightEverything() //interface_common code highlight
      }
  }
  var screenfitted = false;
  function fitscreen(){
      var h = $(window).height().toString()+'px'
  
      geid('content').style.height = !screenfitted?h:'300px';
      geid('parsedcontent').style['max-height'] = !screenfitted?h:'800px';
  
      screenfitted = !screenfitted
  }
  function extract_resource_from_tag(text) {
    // this function extract resource tags from text,
    // then find matches in list.rlist(the uploaded resources array)
  
    if(!render||!render.resource_extractor)return undefined;
    if(!window.list || !window.list.rlist) return undefined;
    var arr = text.match(render.resource_extractor);
    if(!arr) return undefined;
    var rarr = [];
    arr.map(function(item) {
      var reskey = item.replace(render.resource_extractor,'$1')
      window.list.rlist.map(function(item){
        if(item.rid==reskey){
          rarr.push(item)
        }
      })
    });
    return rarr
  }
  
  
  //下面是新编辑器渲染公式
  function mathfreshnew(){
    if(MathJax){
       MathJax.Hub.PreProcess(geid('text-elem'),function(){MathJax.Hub.Process(geid('text-elem'))})
      //MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    }
    if(hljs){
      ReHighlightEverything() //interface_common code highlight
    }
  }
  
  //下面是新编辑器渲染公式
  function mathfresha1(){
    $("#editora2").html($("#editora1").val())
    if(MathJax){
      MathJax.Hub.PreProcess(geid('editora2'),function(){MathJax.Hub.Process(geid('editora2'))})
      //MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    }
    if(hljs){
      ReHighlightEverything() //interface_common code highlight
    }
  }
  
  
  //重新编辑公式
  //使用方法，在编辑器中双击渲染好了的公式
  function reedit(para){
    $(".w-e-icon-math").click()
    var typelength = $(para).find("script").attr("type").length
    if(typelength < 15){
      $("#editora1").val("$"+$(para).find("script").html()+"$")
    }else{
      $("#editora1").val("$$"+$(para).find("script").html()+"$$")
    }
    $(para).addClass("righteditor")
    window.localStorage.pMark = "1";
  }
  
  function fitscreennew(){
    var h = $(window).height().toString()+'px'
  
    geid('content').style.height = !screenfitted?h:'300px';
    geid('parsedcontent').style['max-height'] = !screenfitted?h:'800px';
  
    screenfitted = !screenfitted
  }

  Object.assign(window, {
    dataURItoBlob,
    get_selection,
    replace_selection,
    set_selection,
    getSearchKV,
    blockOnChange,
    threadTypesOnChange,
    childrenOnChange,
    parentsOnChange,
    onPost,
    groupingForums,
    createOption,
    mathfresh,
    fitscreen,
    extract_resource_from_tag,
    mathfreshnew,
    mathfresha1,
    reedit,
    fitscreennew,
  });
