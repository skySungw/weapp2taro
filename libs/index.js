// import './convertJS.js';
const fs = require('fs');
const path = require('path');
const compiler = require('vue-template-compiler')

const code = `
<view class="ddd">
  <wxs module="filter" src="../../common/filter.wxs"></wxs>
  <!--component/countDown/countDown.wxml-->
  <!-- 有新增倒计时在下面封装  classType < 4 都是以前的倒计时   -->
  <!-- 秒杀版本以前的倒计时 -->
  <navBar title-text="分类" showCapsule="{{ false }}" />
  <view class="classifyBox {{isDjk?'djk':''}}" style="height:{{windowHeight - (navBarHeight + tabBarHeight + 62)}}px">
    <block wx:if="{{ goodsList.length > 0 }}">
      <view class='search_hearder'>
        <image class='search_icon' mode='widthFix' src='/images/search-icon-black.png'></image>
        <view class='search_kuai' wx:if="{{ input_text }}" bindtap='search_clear_btn'></view>
        <input class='search_input' disabled="true" value='{{ input_text }}' placeholder-style="color: #9D9FB8;" data-type="2" bindtap="handleSearch" placeholder="搜一搜商品名称" bindconfirm='search_btn' />
      </view>
      <view class="content" style="height:100%;">
        <view class="left">
          <scroll-view scroll-y="true" style="height:100%;" bindscrolltoupper="upper" bindscrolltolower="lower" bindscroll="scroll" style="padding-bottom:{{tabbarHeight}}px">
            <view class="item {{ identificationId == item.id ? 'active' : '' }}" data-item="{{ item }}" wx:for="{{ goodsArea }}" wx:key='key' bindtap='switchArea'>
              {{item.name}}
            </view>
          </scroll-view>
        </view>
        <view class="right">
          <scroll-view scroll-y="true" style="height:100%;" bindscrolltoupper="upper" bindscrolltolower="lower" bindscroll="scroll" style="padding-bottom:{{tabbarHeight}}px">
            <view class="scroll">
              <view class="right_list" wx:for="{{ goodsList }}" wx:key='key' data-item="{{item}}" data-type="1" bindtap="handleSearch">
                <image class="right_img" src="{{ filter.getCutSrc(item.logo,'@216x216') }} "></image>
                <view class="right_text">{{ item.name }}</view>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </block>
    <block wx:if="{{defaultType}}">
      <missingData-view 
        zhi="new1" 
        textval="暂无内容，敬请期待"
        textval2="继续逛逛"
        imageUrl="{{ url_link + 'images/empty-log.png' }}">
      </missingData-view>
    </block>
  </view>
</view>
`

// 删除 parent的循环引用
function deleteEmptyProperty(object) {
    for (var i in object) {
        var value = object[i];
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                if (value.length == 0) {
                    delete object[i];
                    continue;
                }
            }
            if (i == 'parent') {
                delete object[i];
            } else {
                deleteEmptyProperty(value);
            }
        } else {
            if (i == 'parent') {
                delete object[i];
            }
        }
    }
}



// 写模板
function wHtml(file, result) {
    fs.writeFile(file, result, 'utf-8', function(err) {
        if (err) {
            console.log('abc', err);
            return false;
        }
    })
}

const getData = code => {
    return compiler.compile(code, false);
}
const data = getData(code);
const dist = path.resolve(__dirname, '..', 'dist', 'a.json');
deleteEmptyProperty(data);
wHtml(dist, JSON.stringify(data));
const renderTreeData = data.ast;

// attribute 转字符串
function setAttributeMethod(key, value) {
    let attrStr = `:${key}=`;
    let classArr = [];
    let arr = [];
    if (key == 'class') {
        value = value.replace(/\s+/g, '');
        value = value.replace(/(\{\{)([^}]+)(\}\})/g, ' $2');

        arr = value.split(' ');

        arr.forEach(v => {
            let obj = {};
            if (/\?/.test(v)) {
                let attrInnerArr = v.split('?');
                let attrInnerKey = attrInnerArr[1].split(':')[0].replace(/\'|\"/g, '');
                let attrInnerValue = `${attrInnerArr[0]}`;
                obj[attrInnerKey] = attrInnerValue;
                // 动态添加一个class
                classArr.push(obj);
            } else {
                classArr.push(v);
            }
        })
    } else if (key == 'style') {
        // style="height:{{windowHeight - (navBarHeight + tabBarHeight + 62)}}px"

    }
    let vvalue = `'${JSON.stringify(classArr)}'`.replace(/\:\"([^"]+)\"/g, ':$1');
    return attrStr + vvalue;
}

let str = '';
let count = 0;
// 下面用来拼dom元素
function startGenerator(rootData) {
    count += 2;
    if (!rootData['tag']) {
        return false;
    }
    str += '\n';
    let nbspNum = '';
    for (let i = 0; i < count; i++) {
        nbspNum += ' '
    }
    // 拼标签
    str += `${nbspNum}<${rootData['tag']}`;
    // 拼属性
    const attrObj = rootData['attrsMap'];
    // 动态属性过滤
    let filterArr = ['class', 'style'];
    if (attrObj) {
        for (let attrItem in attrObj) {
            // 如果属性中有变量 {{}}
            if (filterArr.includes(attrItem) && /\{\{([^}]+)\}\}/.test(attrObj[attrItem])) {
                str += ' ' + setAttributeMethod(attrItem, attrObj[attrItem]);
            } else if (/^\{\{([^}]+)\}\}$/.test(attrObj[attrItem])) {
                // 属性中，只有 {{ xxx }} 
                const wxKeysObj = {
                    'wx:if': 'v-if',
                    'wx:elif': 'v-else-if',
                    'wx:else': 'v-else',
                    'wx:for': 'v-for',
                }
                let attrStr = '';
                // 如果是wx:for，需要拼 v-for="(item, index) in list"
                if (attrItem == 'wx:for') {
                    let letItem = 'item';
                    let letIndex = 'index';
                    if (attrObj['wx:for-item']) {
                        letItem = attrObj['wx:for-item'];
                    }
                    if (attrObj['wx:key']) {
                        letIndex = attrObj['wx:key'];
                    }
                    attrStr = wxKeysObj[attrItem];
                    str += ` ${attrStr}="(${letItem}, ${letIndex}) in ${attrObj[attrItem].replace(/^(\{\{)([^}]+)(\}\})$/, '$2')}"`;
                } else {
                    // wx:for 以外的 ,wxKeysObj 里的替换
                    if (wxKeysObj[attrItem]) {
                        attrStr = wxKeysObj[attrItem]
                    } else {
                        attrStr = `:${attrItem}`;
                    }
                    str += ` ${attrStr}="${attrObj[attrItem].replace(/^(\{\{)([^}]+)(\}\})$/, '$2')}"`;
                }

            } else {
                // 属性中 没有 花括号的 {{ }}
                const wxNoneConfig = {
                    'wx:key': ':key'
                };
                // 如果有 wx:item, wx:key
                if (attrItem == 'wx:for-item') {
                    str += '';
                } else if (attrItem == 'wx:key') {
                    str += ` ${wxNoneConfig[attrItem]}="${attrObj[attrItem]}"`;
                } else {
                    str += ` ${attrItem}="${attrObj[attrItem]}"`;
                }
            }
            // str += ` ${attrItem}="${attrObj[attrItem]}"`;
        }
    }
    // 开始标签闭合
    str += '>';
    // 如果标签中间有内容，拼content expression
    const childrenExp = rootData['children'];
    console.log("childrenExp", childrenExp)
    if (childrenExp && childrenExp.length) {
        childrenExp.forEach(childItem => {
            if (childItem['text']) {
                str += childItem.text;
            }
        })
    }
    // 判断闭合标签是否需要换行
    let breakFlag = false;
    // 拼子元素
    const childArr = rootData['children'];
    if (childArr && childArr.length) {
        breakFlag = true;
        childArr.forEach(v => {
            startGenerator(v);
        })
    }
    // 拼结束标签
    if (breakFlag) {
        str += '\n';
        str += `${nbspNum}</${rootData['tag']}>`;
    } else {
        str += `</${rootData['tag']}>`;
    }
    return str;
}
const domRes = startGenerator(renderTreeData);
console.log(domRes);