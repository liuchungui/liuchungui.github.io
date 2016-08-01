---
layout: post
title: "微信公众号开发总结"
date: 2016-08-01 11:51:36 +0800
comments: true
categories: web
---

公司准备在微信公众号上做个东西，所以研究了一周的微信公众号开发，今天在这里做一个总结。
在总结之前，先说一下本人使用的环境，语言是PHP，框架是[CI](https://github.com/bcit-ci/CodeIgniter)和CI框架下的一个RESTFul框架[codeigniter-restserver](https://github.com/chriskacerguis/codeigniter-restserver)。

<!-- more -->

## 一、配置服务器
在开发之前，我们首先需要在微信公众号下设置服务器配置，这里完全可以参考官方的[接入指南](https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421135319&token=&lang=zh_CN)。
需要说明两点的是：

1. 我们只能填写一个URL（服务器地址），当微信服务器想要发送消息给我们服务器，只能通过这个URL来进行交互。
2. 我们在接入的时候，有个验证消息是否来自微信服务器的过程，这个验证过程是GET请求，我们需要输出echostr，验证代码如下：

```php
    /**
     * 检查消息是否来自微信
     * @return bool
     */
    private function check_from_wx() {
        //检查$_GET中的参数
        param_check($_GET, ['signature', 'timestamp', 'nonce']);

        //获取参数
        $signature = $_GET["signature"];
        $timestamp = $_GET["timestamp"];
        $nonce = $_GET["nonce"];

        $token = WX_APP_TOKEN;
        $tmpArr = array($token, $timestamp, $nonce);
        // use SORT_STRING rule
        sort($tmpArr, SORT_STRING);
        $tmpStr = implode($tmpArr);
        $tmpStr = sha1($tmpStr);
        
        //验证
        if($tmpStr == $signature) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * 配合微信服务器验证是否有效
     */
    public function check_get() {
        $echoStr = $this->get("echostr");
        if($this->check_from_wx()) {
           echo $echoStr;
        }
        else {
            echo "验证不通过";
        }
        exit;
    }
```
看到上面的代码，你也许会有疑问，为什么在`check_get`方法中使用`$this->get`获取get参数，而在`check_from_wx`方法中使用的是`$_GET`。这是因为我们后面接收的消息是微信服务器向我们发送POST请求，但是验证的参数却是放在URL后面，所以为了兼容，专门封装了一个`check_from_wx`的私有方法。

到这里，我们算是配置好了，下面我们来看看如何接收和回复用户发来的消息。

## 二、接收消息和回复消息	
接收和回复消息的流程图大概就是这样的：
![](http://ww4.sinaimg.cn/large/7746cd07jw1f66f138zo1j218q0imacd.jpg)
看上面的流程图，我们可以把整个接收和回复消息分成四个步骤：

* 第一步：用户在微信公众号内发送一条消息，微信客户端将这条消息发送给微信服务器。
* 第二步：微信服务器将消息以POST方式将消息提交给我们服务器，而这个服务器的地址只有一个，就是我们前面配置服务器填写的URL地址。消息的数据格式是XML格式的。	
* 第三步：我们收到这个消息之后，做出对应的回复，返回对应的XML数据，就算是进行回复了。
* 第四步：微信服务器将我们服务器的消息返回给微信客户端，这样用户就看到了我们回复的消息了。


看了上面的消息接收和回复流程图，我们下面使用代码进行实现。在配置服务器的时候，我先前填写的URL地址对应的接口是`check`，所以接收消息的PHP代码这么写：

```php
    /**
     * 检查消息是否来自微信
     * @return bool
     */
    private function check_from_wx() {
        //检查$_GET中的参数
        param_check($_GET, ['signature', 'timestamp', 'nonce']);

        //获取参数
        $signature = $_GET["signature"];
        $timestamp = $_GET["timestamp"];
        $nonce = $_GET["nonce"];

        $token = WX_APP_TOKEN;
        $tmpArr = array($token, $timestamp, $nonce);
        // use SORT_STRING rule
        sort($tmpArr, SORT_STRING);
        $tmpStr = implode($tmpArr);
        $tmpStr = sha1($tmpStr);
        
        //验证
        if($tmpStr == $signature) {
            return true;
        }
        else {
            return false;
        }
    }

    public function check_post() {
        //检查消息是否来自微信
        if(!$this->check_from_wx()) {
            //非法
            echo "非法操作";
        }
        
        //获取POST参数
        $param = file_get_contents("php://input");
        //将xml格式中的数据读取成数组
        $param = $this->format->factory($param, 'xml')->to_array();

        //将消息插入by_message表中
        $result = $this->share_model->insert($msg_info, 'by_message');
        
        //回复空字符串
        echo "";
   }
```
  
  上面代码值得注意有三个地方，第一个地方是我们检查消息是否来自微信，是获取`$_GET`中的参数；第二个地方是我们不能使用`$_POST`和`$this->post`来获取post参数，只能使用`file_get_contents("php://input")`来获取；第三个地方是当我们没有消息回复的时候，回复`success和空字符串`就代表交互成功，否则用户就会看到`该公众号暂时无法提供服务`。
  
  当写好代码之后，我们在微信公众号中发送消息，它就会将消息存入到`by_message`表中，我们就可以进行查看。如果出现`该公众号暂时无法提供服务`，那就可能我们服务器出错误了，可以开启日志功能，使用`log_message`输出日志进行调试。
  
 当接收消息没问题之后，我们就可以进行回复消息了，代码如下：

```php
    public function check_post() {
        //检查消息是否来自微信
        if(!$this->check_from_wx()) {
            //非法
            echo "非法操作";
        }
        
        //获取POST参数
        $param = file_get_contents("php://input");
        //获取xml中的数据
        $param = $this->format->factory($param, 'xml')->to_array();

        //选出参数
        $msg_info = array_choose($param, ['Content', 'ToUserName', 'FromUserName', 'MsgId', 'MsgType']);
        //将消息插入数据库
        $result = $this->share_model->insert($msg_info, 'by_message');

        //获取信息
        $to_user = $param['ToUserName'];
        $from_user = $param['FromUserName'];
        $content = $param['Content'];

        //去掉消息id
        unset($param['MsgId']);

        //回复的内容
        $content = 'http://xxxxxx.com/';
        $response_text = "<xml>
                            <ToUserName><![CDATA[%s]]></ToUserName>
                            <FromUserName><![CDATA[%s]]></FromUserName>
                            <CreateTime>%s</CreateTime>
                            <MsgType><![CDATA[%s]]></MsgType>
                            <Content><![CDATA[%s]]></Content>
                          </xml>";
        $response_text = sprintf($response_text, $from_user, $to_user, time(), $param['MsgType'], $content);
        echo $response_text;
    }
```

配置好之后，我们在微信公众输入字符，它就会回复`http://xxxxxx.com/`。

上面代码需要注意的是，我们回复消息的时候，返回的数据格式是`xml格式`的，而且对格式有严格要求。我前面使用框架中的`format类`生成xml的数据是无法被微信读取的，所以建议和我上面一样的写法。

还有，上面回复的消息是文本消息，我们还可以回复图片、图文、语音、视频、音乐等消息，其实它们都大体相同，查看官方的文档[被动回复用户消息](https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140543&token=&lang=zh_CN)这一节，按照对应的格式进行回复就行了。

到这一步的时候，是不是很有成就感？其实，这还是很小的一步，微信开发还有很多的内容，就消息管理这部分来说，它就分接收和发送消息两大类。	

其中，接收消息有两种：		

* 第一种：接收普通消息，它是微信用户向公众号发送的消息，我们上面说的就是接收普通消息。
* 第二种：接收事件消息，它是微信用户在微信公众号里面交互过程中产生的事件消息，例如关注/取消事件、扫描带参数二维码等等。具体可以接收哪些事件消息，就去查询微信的开发文档吧。接收事件消息说起来很高端的样子，其实它和普通消息差不多，整个接收和回复流程和上面一样，只是有的事件消息是不允许我们回复用户的。
 
而发送消息就有被动`回复消息`、`客服消息`、`群发消息`、`模板消息`四种，其中这四种我又把它分成两小类，被动回复消息算是一类，我们前面实现对用户消息的回复就算是这一类；另外三种我将它们归类为主动发送消息，与被动回复消息不同的是，它会被微信主动推送给用户，流程大概如下图：

![](http://ww1.sinaimg.cn/large/7746cd07jw1f66jvxhdfij20nx07uaaf.jpg)

了解了流程之后，我们下面来实现模板消息的发送。

## 三、发送模板消息
模板消息可以定制，而且发送模板消息后，微信会主动推送给用户，这是我们开发很需要的一个功能。（注：模板消息只有认证后的服务号才可以使用）。

首先，我们在微信公众平台的`功能->添加功能插件`处添加这个功能，进入模板消息页面，从模板库中添加一个模板消息，获取到模板ID。当然，我们也可以创建一个符号自己业务的模板消息，进行定制（这个需要申请）。

然后，我们对应着模板详情的数据格式，写一个接口专门用来发送模板消息。

下面是模板详情：

![](http://ww2.sinaimg.cn/large/7746cd07jw1f658hkxak6j20iu0kb75u.jpg)

对应上面的模板消息，我们的接口这么写：

```
/**
     * 发送模板消息
     */
    public function send_template_message_get() {
        //检查参数
        param_check($this->get(), ['uid']);
        $uid = $this->get('uid');

        //wx appid
        $wx_app_id = WX_APP_ID;
        $wx_app_secret = WX_APP_SECRET;

        //get access token
        $token_info = file_get_contents("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=$wx_app_id&secret=$wx_app_secret");
        $token_info = json_decode($token_info, true);
        $access_token = $token_info['access_token'];

        //获取用户信息
        $openid = $this->user_model->get_value('openid', $uid);

        //组织参数
        $param = array(
            "touser" => $openid,
            "template_id" => "jt_Rl5X9QWXMiRihrQz67n4riGt3kaPA81Zku0wLm9M",
            "url" => "http://www.beyondwinlaw.com/test/wx/test/home.html",
            "data" => [
                "first" => [
                    "value" => "案件有新进展",
                    "color" => "#173177"
                ],
                "keyword1" => [
                    "value" => "jkfdjafjdsfjdjfs",
                    "color" => "#173177"
                ],
                "keyword2" => [
                    "value" => "jkfdjafjdsfjdjfs",
                    "color" => "#173177"
                ],
                "keyword3" => [
                    "value" => "jkfdjafjdsfjdjfs",
                    "color" => "#173177"
                ],
                "keyword4" => [
                    "value" => "2016-07-12 11:11:11",
                    "color" => "#173177"
                ],
                "keyword5" => [
                    "value" => "jkfdjafjdsfjdjfs",
                    "color" => "#173177"
                ],
                "remark" => [
                    "value" => "点击查看案件进度详情",
                    "color" => "#173177"
                ]
            ]
        );

        //发送请求
        $url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=$access_token";
        $result = send_post($url, $param);
        answer([
            "result" => $result
        ]);
    }
```

效果是这样的：

<p align="center" >
  <img src="http://ww3.sinaimg.cn/mw690/7746cd07jw1f65905jwfbj20mq10iq75.jpg" height=554 width = 345>
</p>

这样，我们就实现了模板消息的发送，至于客服消息、群发接口，原理差不多，因为我没实现过，这里就不多说了。

## 四、网页授权，获取用户信息
微信采用的是OAuth对开发者进行授权的，具体OAuth授权原理请google查询。在开发之前，我们需要先到公众平台官网中的`开发-接口权限-网页服务-网页授权获取用户基本信息`的配置选项中，修改授权回调域名。

![](http://ww2.sinaimg.cn/large/7746cd07jw1f65ggry50ij20y20dimyr.jpg)

整个授权过程，其实微信官方已经说的很清楚了。我这里简略说一下，算是总结下吧！

首先，我们需要获取access_token，它的时序图和微信开放平台类似，如下：
![](http://ww1.sinaimg.cn/mw690/7746cd07jw1f68rcxtd2lj21020fu40c.jpg)

这整个过程是当用户要登录我们的网站时，我们带上回调地址、AppId、scope等参数跳转到微信授权页面；然后获得用户的同意之后，它会跳转到我们的回调地址，并带上code参数；最后我们通过code、AppId、AppSecret请求接口，获取access_token。

之后，我们通过access_token请求对应的接口，就可以获取用户的基本信息了。

需要注意地方有两个：

1. 我们的回调地址需要进行encodeURL，否则可能回调地址中url后面的参数会丢失。
2. 我们的回调地址的域名必须是前面配置的域名。

具体的实现细节，根据官方文档[微信网页授权](https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140842&token=&lang=zh_CN)和[网站应用微信登录开发指南](https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1419316505&token=&lang=zh_CN)的步骤来就行了。

## 五、JS-SDK的使用	
在我们要做的产品中，我们希望能够控制每个页面分享的链接，而JS-SDK就可以做到这一切。
它的使用步骤可以查阅[微信JS-SDK说明文档](https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421141115&token=&lang=zh_CN)这个文档，而且在网页最后还有对应的[DEMO页面](http://demo.open.weixin.qq.com/jssdk)和[示例代码](http://demo.open.weixin.qq.com/jssdk/sample.zip)。

我们的实现是这样的，在前端专门写了一个JS文件`wx_share.js`，这个JS文件中将当前的url传给后台，请求后台的数据对JS-SDK进行配置。代码如下：

```javascript
var server_url = "http://192.168.30.249/by/wx_api/index.php/share/wx_config";
var url = window.location.href;

//配置微信
$.ajax({
    type: "GET",
    url: server_url,
    data: {
        url: encodeURI(url)
    },
    dataType: "json",
    success: function(data){
        // alert('请求分享配置数据成功');
        wx.config({
            debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId: data.data.appId, // 必填，公众号的唯一标识
            timestamp: data.data.timestamp, // 必填，生成签名的时间戳
            nonceStr: data.data.nonceStr, // 必填，生成签名的随机串
            signature: data.data.signature,// 必填，签名，见附录1
            jsApiList: ['onMenuShareAppMessage', 'onMenuShareTimeline'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
        });
        wx.ready(function() {
            // alert("分享验证完毕");
        });
        wx.error(function() {
            // alert("分享验证失败");
        });

        //获取uid和link_id
        var uid = localStorage.getItem("uid");
        var linkId = localStorage.getItem("link_id");
        var shareUrl = "http://www.baidu.com";
        //存在linkId, 则分享带上link_id等参数
        if(linkId != undefined && linkId != "" && linkId != null) {
          shareUrl = shareUrl + "?super_id=" + uid + "&link_id=" + linkId;
        }
        // alert("分享链接: "+shareUrl);

        wx.onMenuShareAppMessage({
            title: '分享测试', // 分享标题
            desc: '测试一下', // 分享描述
            link: shareUrl, // 分享链接
            imgUrl: 'http://www.beyondwinlaw.com/gw4/images/zhongjie.jpg', // 分享图标
            type: 'link', // 分享类型,music、video或link，不填默认为link
            dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
            success: function () {
                // 用户确认分享后执行的回调函数
                // alert("分享成功");
            },
            cancel: function () {
                // 用户取消分享后执行的回调函数
                // alert("取消分享");
            }
        });
    },
    error: function(data) {
        alert('请求分享配置数据失败');
    }
});
```

而具体JS-SDK权限签名算法的实现是放在后台的，这个实现我是直接使用官方的`jssdk`的类，只是将它稍微修改了下。
`share.php`中`wx_config`接口实现如下：

```
    /**
     * 获取微信配置
     */
    public function wx_config_get() {
        //获取参数
        param_check($this->get(), ['url']);
        $url = $this->get('url');
        $url = urldecode($url);

        $jssdk = new JSSDK(WX_APP_ID, WX_APP_SECRET, $url);
        $signPackage = $jssdk->GetSignPackage();
        answer($signPackage);
    }

```
而修改后的JS-SDK代码如下：

```
class JSSDK {
  private $appId;
  private $appSecret;
  private $url;

  public function __construct($appId, $appSecret, $url) {
    $this->appId = $appId;
    $this->appSecret = $appSecret;
    $this->url = $url;
  }

  public function getSignPackage() {
    // 注意 URL 一定要动态获取，不能 hardcode.
//    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
//    $url = "$protocol$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
    $url = $this->url;

    //wx appid
    $wx_app_id = $this->appId;
    $wx_app_secret = $this->appSecret;

    //get token
    $token_info = file_get_contents("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=$wx_app_id&secret=$wx_app_secret");
    $token_info = json_decode($token_info, true);
    $access_token = $token_info['access_token'];

    //get ticket
    $ticket_info = file_get_contents("https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=$access_token&type=jsapi");
    $ticket_info = json_decode($ticket_info, true);
    $ticket = $ticket_info['ticket'];
    
    //拼接字符串
    $timestamp = time();
    $nonceStr = $this->createNonceStr();
    // 这里参数的顺序要按照 key 值 ASCII 码升序排序
    $string = "jsapi_ticket=$ticket&noncestr=$nonceStr&timestamp=$timestamp&url=$url";

    //使用sha1进行签名
    $signature = sha1($string);

    $signPackage = array(
      "appId"     => $this->appId,
      "nonceStr"  => $nonceStr,
      "timestamp" => $timestamp,
      "url"       => $url,
      "signature" => $signature,
      "rawString" => $string
    );
    return $signPackage; 
  }

  private function createNonceStr($length = 16) {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    $str = "";
    for ($i = 0; $i < $length; $i++) {
      $str .= substr($chars, mt_rand(0, strlen($chars) - 1), 1);
    }
    return $str;
  }

  private function httpGet($url) {
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_TIMEOUT, 500);
    // 为保证第三方服务器与微信服务器之间数据传输的安全性，所有微信接口采用https方式调用，必须使用下面2行代码打开ssl安全校验。
    // 如果在部署过程中代码在此处验证失败，请到 http://curl.haxx.se/ca/cacert.pem 下载新的证书判别文件。
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, true);
    curl_setopt($curl, CURLOPT_URL, $url);

    $res = curl_exec($curl);
    curl_close($curl);

    return $res;
  }

  private function get_php_file($filename) {
    return trim(substr(file_get_contents($filename), 15));
  }
}
```

这里需要说明一下的是，这里我只是测试功能的实现，`获取access_token`是直接通过接口实时进行获取的。如果是在生产环境，还请参考官方的[获取access_token](https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140183&token=&lang=zh_CN)。

在这里我碰到一个问题，耽搁了挺久的时间。那就是前面我按照官方文档自己写的签名算法，然后各种配置不成功。后来下载了官方的demo，发现官方文档jssdk没有问题，然后将自己的签名算法放入官方的jssdk中，也没有问题。因为官方文档是前后端放在一块的，所以总感觉url不对，但是对`url进行encodeURL`之后，发现还是不行。最后和小伙伴一起google了之后，`将生成数字随机替换成生成字母随机数`，然后配置就没问题了。

到这一步，逻辑已经全部实现，只需要在我们对应的页面中引入JS-SDK和wx_share.js文件就行了，如下：

```
<script src="http://res.wx.qq.com/open/js/jweixin-1.1.0.js"></script>
<script src="js/wx_share.js"></script>
```

成功之后的效果如下：
<p align="center" >
  <img src="http://ww4.sinaimg.cn/large/7746cd07jw1f6e24s7grrj20ku112q4f.jpg" height=667 width=375>
</p>

## 六、自定义菜单
自定义菜单这个是比较简单的，我们只需要将我们配置数据POST到微信服务器，微信用户进入我们公众号之后，看到界面就变成了我们自定义菜单样式。
在这里，我也写了一个接口，用来修改菜单：

```php
   /**
     * 更改微信公众号菜单
     * @note 这个接口在线上是禁止调用的,它只需要更改的时候,调用一次就行了
     */
    public function change_menu_get() {
        //获取access_token, 需要中控服务器,否则会造成服务不稳定,咱们这里暂时不这么做
        $app_id = WX_APP_ID;
        $app_secret = WX_APP_SECRET;
        $content = file_get_contents("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=$app_id&secret=$app_secret");
        $info = json_decode($content, true);
        $access_token = $info['access_token'];

        //自定义菜单
        $auth_url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid={$app_id}&redirect_uri=http://www.liuchungui.com/api/wx_api/index.php/share/test&response_type=code&scope=snsapi_userinfo&state=123#wechat_redirect";

        $menu = array(
            "button" => [
                [
                    "type" => "view",
                    "name" => "合作",
                    "url" => $auth_url
                ],
                [
                    "name" => "菜单",
                    "sub_button" => [
                        [
                            "type" => "view",
                            "name" => "官网",
                            "url" => "http://www.liuchungui.com/"
                        ],
                        [
                            "type" => "view",
                            "name" => "关于我们",
                            "url" => "http://www.liuchungui.com/about.html"
                        ]
                    ]
                ]
            ]
        );

        $menu_url = "https://api.weixin.qq.com/cgi-bin/menu/create?access_token=$access_token";
        //发送POST请求
        $result = send_post($menu_url, $menu);
        $result = json_decode($result, true);
        //返回数据
        if($result['errcode'] === 0) {
            answer(true, '更改菜单');
        }
        else {
            answer(false, '更改菜单');
        }
    }
```

这个只是创建菜单，其他操作菜单的接口请查阅[自定义菜单](https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421141013&token=&lang=zh_CN)。

效果如下：
<p align="center" >
  <img src="http://ww2.sinaimg.cn/mw690/7746cd07jw1f67s9b3h6hj20ks10c78z.jpg" height=604 width=345>
</p>

## 推荐
在搜索资料的时候，无意之间找到一个微信公众号开发的框架[wechat](https://github.com/overtrue/wechat)，star不少，而且看了下开发文档[EasyWechat](https://easywechat.org/)，讲得比较详细，应该是一个不错的框架，后期准备使用它来进行开发，推荐大家看看。

