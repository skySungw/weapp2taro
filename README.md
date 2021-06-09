## 微信小程序转Taro 工具

#### [git 地址](https://github.com/skySungw/weapp2taro)

目前代码以tag分支为准

## 安装及使用

#### 安装
```
  npm i -g weapp2taro
```
#### 使用命令

目前支持以下命令
```
  weapp2taro c // 将wxml、wxss、json、js四个文件 ，合成同目录下的vue、scss文件
  weapp2taro a // 对比排查：js代码中定义的方法，而wxml页面没有调用的方法
  weapp2taro -v // 查看 版本号
```
#### 使用配置(mac、windows电脑需要做区分)

在根目录，添加配置文件 weapp2taro.config.json , 文件内容如下：

```
  {
      port: 8877, // 服务端口，为 weapp2taro a 做页面服务
      compute: 'mac', // 'windows' | 'mac'，根据自己电脑做适配
      // filePaths: ['src\\pages', 'src\\component'], // 需要匹配的目录
      sourceDir: 'src', // 源文件目录
      includeDir: ['pages', 'component'], // 需要转换的文件目录
      outPutDir: 'convertDir' // 转换后文件目录
  }

```

## 以下是完成的一些功能

#### Page组件

完成了以下几个属性转换

```
  data -> data() { return {} }
  Page() | Component() -> export default {}
```
##### 微信小程序代码
```
  Page({
    data: {
      name: 'zs'
    }
  })
```
转成 Taro
```
  export default {
    data: function() {
      return {
        name: 'zs'
      }
    }
  }
```

#### Component组件

完成了以下几个属性转换

```
  data --> data() { return {} }
  properties --> props
  properties['observer']  --> watch
  observer  --> watch
  pageLifetimes['hide']  --> onHide
  pageLifetimes['show']  --> onShow
  pageLifetimes['resize']  --> onResize
  attached --> mounted
  ready --> onReady
  error --> onError
```
未完成
```
  properties['optionalTypes']
```

##### 微信小程序代码
```
  Component({
    data: {
        test: 'abc'
    },
    properties: {
        lists: Object,
        count:{
            type: String,
            value: '',
            observer: function (newVal, oldVal){
                this.setData({
                    count:newVal
                })
                console.log(newVal, oldVal)
            }
        }
    },
    pageLifetimes: {
        // 组件所在页面的生命周期函数
        hide: function () {
            clearInterval(this.data.timer);
        },
        show:function () {
            let t = this.data.endtime - new Date().getTime();
            if (t >= 0) {
                this.countDown(t / 1000);
            }
        },
        resize:function() {
            console.log("resize");
        }
    },
    attached: function() {
        console.log("attached");
    },
    ready: function() {
        console.log("ready");
    },
    error(err) {
        console.log("err", err);
    },
    observers: {
        'some.subfield': function(subfield) {
          subfield === this.data.some.subfield
        },
        'arr[12]': function(arr12) {
          arr12 === this.data.arr[12]
        }
    }
  });
```
转成 Taro
```
  export default {
    // 组件所在页面的生命周期函数
    onHide: function () {
        clearInterval(this.data.timer);
    },

    onShow:function () {
        let t = this.data.endtime - new Date().getTime();
        if (t >= 0) {
            this.countDown(t / 1000);
        }
    },

    onResize:function() {
        console.log("resize");
    },

    data: function() {
        return {
            test: 'abc'
        };
    },

    props: {
        lists: Object,
        count:{
            type: String,
            default: ''
        }
    },

    mounted: function() {
        console.log("attached");
    },

    onReady: function() {
        console.log("ready");
    },

    onError(err) {
        console.log("err", err);
    },

    watch: {
        'some.subfield': function(subfield) {
          subfield === this.data.some.subfield
        },

        'arr[12]': function(arr12) {
          arr12 === this.data.arr[12]
        },

        count: function (newVal, oldVal){
            this.setData({
                count:newVal
            })
            console.log(newVal, oldVal)
        }
    }
  };
```


html标签转换

```
  <view></view>    -----  <div></div>
  <image></image>  -----  <img></img>
  <image />        -----  <img />
  <text></text>    -----  <span>
  <block></block>  -----  <div></div>  <fragment></fragment>

  
```


##### wxml转换

已实现转换标签属性

```
  wx:if   ------------   v-if
  wx:for  ------------   v-for (item, index) in list
  wx:key  ------------   :key
  wx:for-item  -------  做以下处理
    wx:for="list.item"   wx:for-item="subItem" wx:key="index"     -------------   v-for="(subItem, index) in list.item" :key="index"
  class="{{ flag ? 'hide' : 'show'}}"    -----------    :class="[(flag ? 'hide' : 'show')]"
  注意: style只做了简单处理,把 "{{}}" 去掉了,其它情况需要各位自行检查
  style="height: {{windowHeight - 50}}px;margin-top:50px"   :style="{height: windowHeight - 50px;margin-top:50px}"


```