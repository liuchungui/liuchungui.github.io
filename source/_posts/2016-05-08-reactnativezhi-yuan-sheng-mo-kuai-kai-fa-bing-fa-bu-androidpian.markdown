---
layout: post
title: "ReactNative之原生模块开发并发布——android篇"
date: 2016-05-08 14:00:09 +0800
comments: true
categories: ReactNative
keywords: [ReactNative, 原生模块, react native, ReactNative原生模块, react native 原生模块, react native 原生模块发布, reactNative原生模块android]
tags: ReactNative, 原生模块, react native, ReactNative原生模块, react native 原生模块, react native 原生模块发布, reactNative原生模块android

---

前段时间做了个ReactNative的App，发现ReactNative中不少组件并不存在，所以还是需要自己对原生模块进行编写让JS调用，正是因为在这个编写过程中遇到不少问题，发觉了官网文档中许多的不足。所以产生了写一个实践教程的想法，最终有了这么一篇文章。

整篇文章主要以编写一个原生模块为例子，来讲述了我们在编写原生模块所用到的一些知识，并且在整个例子中，配有了完整的实践代码，方便大家理解并调试。除了这些内容，文章还讲述了我们如何将自己编写的原生模块发布到npm上分享给别人使用。希望能够给大家带来帮助，也希望大家将自己编写的原生模块分享出来。

示例代码github地址：[https://github.com/liuchungui/react-native-BGNativeModuleExample](https://github.com/liuchungui/react-native-BGNativeModuleExample)

<!-- more -->
##准备工作
我们需要先创建一个ReactNative工程，使用如下命令创建。

```sh
$ react native init TestProject
```
创建好工程之后，我们使用android studio打开`TestProject/android/`下的android工程。

之后，点击android studio菜单上的File ——> New ——> New Module，之后选择`Android Library`，设置模块名和包名，我的设置如下：
![](http://ww2.sinaimg.cn/large/7746cd07jw1f3ilkyhcuzj21kw10w42q.jpg)

点击完成之后，我们的安卓项目中就多了个名字为`nativemoduleexample`模块。
![](http://ww1.sinaimg.cn/large/7746cd07jw1f3iluj6owuj20qy11mgt8.jpg)
之后，我们在`app`工程中的`build.gradle`文件中的`dependencies`添加一行`compile project(':nativemoduleexample')`，让主工程`app`依赖我们新创建的Library。

最后，我们还需要让新创建的Library依赖`react native`，和上面差不多，只需要在我们新创建的`nativemoduleexample`下的`build.gradle`中的`dependencies`添加一行`compile "com.facebook.react:react-native:+"`就行了。

##一、编写原生模块代码
####1、创建原生模块，并进行注册
我们首先点击打开前面创建的`nativemoduleexample`库，在`src/main/java/com/liuchungui/nativemoduleexample`目录下创建我们的原生模块类。当然，如果我们前面创建Library的包名不太一样，那`src/main/java/`后面跟上就是前面设置的包名。

在这个目录下，我们首先创建一个原生模块`BGNativeExampleModule`，它继承于`ReactContextBaseJavaModule`。这个原生模块必须实现两个方法，一个是覆写`getName`方法，它返回一个字符串名字，在JS中我们就使用这个名字调用这个模块；另外一个是构造方法`BGNativeExampleModule`。

```java
package com.liuchungui.nativemoduleexample;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.lang.String;

public class BGNativeExampleModule extends ReactContextBaseJavaModule {
    public BGNativeExampleModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    @Override
    public String getName() {
        return "BGNativeModuleExample";
    }
}
```
其中需要注意的是，模块名前的RCT前缀会被自动移除。例如"RCTBGNativeModuleExample"，在JS中的模块名字仍然是BGNativeModuleExample。

到这一步的时候，是不是就可以访问这个模块了？事实是现在还不能访问，因为我们还需要注册这个模块。

为了注册原生模块，我们首先创建一个`BGNativeExamplePackage`类，这个类要求实现`ReactPackage`接口，这个接口有三个方法`createNativeModules`、`createJSModules`和`createViewManagers`。其中，`createNativeModules`是用来添加原生模块的；`createViewManagers`是用来添加原生的UI组件；`createJSModules`暂时没用过，但是看官方的注释，应该是注册我们原生模块中用到的JS模块。

我们这里只需要在`createNativeModules`方法中添加原生模块，其他两个方法返回空数组就行了，整个package类的代码如下：

```
package com.liuchungui.nativemoduleexample;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class BGNativeExamplePackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.asList(new NativeModule[]{
                new BGNativeExampleModule(reactContext),
        });
    }
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
```

最后，这个package需要在`MainActivity.java`文件中的`getPackages`方法中提供。这个文件位于我们的reactNative应用文件夹的android目录中，路径是:`android/app/src/main/java/com/testproject/MainActivity.java`。

```
@Override
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
            new BGNativeExamplePackage()
    );
}
```
到这个时候，我们终于可以在js中访问我们的原生模块了
  
```
import { NativeModules } from 'react-native';
var BGNativeModuleExample = NativeModules.BGNativeModuleExample;
console.log(BGNativeModuleExample);
```

####2、为原生模块添加方法
要导出一个方法给JS使用，Java方法需要使用注解`@ReactMethod`。方法的返回类型必须为void。ReactNative跨语言访问是异步进行的，所以想要给JS返回一个值，唯一的办法是使用回调函数或者发送事件。

```
import com.facebook.react.bridge.ReactMethod;

@ReactMethod
public void testPrint(String name, ReadableMap info) {
	Log.i(TAG, name);
	Log.i(TAG, info.toString());
}
```
在JS中，我们如下调用这个方法：
  
```
BGNativeModuleExample.testPrint("Jack", {
    height: '1.78m',
    weight: '7kg'
});
```
####3、参数类型 
在编写原生模块的时候，我们还需要知道原生Java数据类型和JS数据类型的映射关系：

```
Boolean -> Bool
Integer -> Number
Double -> Number
Float -> Number
String -> String
Callback -> function
ReadableMap -> Object
ReadableArray -> Array
```
详情参考：[ReadableMap](https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/bridge/ReadableMap.java)和[ReadableArray](https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/bridge/ReadableArray.java)

####4、回调函数
原生模块还支持一种特殊的参数——回调函数。它提供了一个函数来把返回值传回给JS。

```
import com.facebook.react.bridge.Callback;

@ReactMethod
public void getNativeClass(Callback callback) {
      callback.invoke("BGNativeExampleModule");
}
```

在JS中，我们可以通过以下方式获取到原生模块的类名：

```javascript
BGNativeModuleExample.getNativeClass(name => {
  console.log("nativeClass: ", name);
});
```

####5、Promises
> 原生模块还可以使用promise来简化代码，搭配ES2016(ES7)标准的async/await语法则效果更佳。如果桥接原生方法的最后一个参数是一个Promise，则对应的JS方法就会返回一个Promise对象。

```java
import com.facebook.react.bridge.Promise;
@ReactMethod
public void testPromises(Boolean isResolve, Promise promise) {
    if(isResolve) {
        promise.resolve(isResolve.toString());
    }
    else {
        promise.reject(isResolve.toString());
    }
}
```
  
JS中如下调用

```javascript
BGNativeModuleExample.testPromises(true)
.then(result => {
    console.log("result is ", result);
})
.catch(result => {
    console.log("result = ", result);
});
```
  
####6、导出常量
  我们在`getContants`方法中导出js所需要使用的常量。
  
```java
@Override
public  Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("BGModuleName", "BGNativeModuleExample");
    constants.put(TestEventName, TestEventName);
    return constants;
}
```
 
 我们在JS中打印`BGModuleName`这个常量的值：
 
```javascript
 console.log("BGModuleName const value = ", BGNativeModuleExample.BGModuleName);
```
 
####7、给JS发送事件
> 原生模块可以在没有被调用的情况下往JS发送事件通知，最简单的办法是通过`RCTDeviceEventEmitter`，这可以通过`ReactContext`获得对应的引用。

在这里，我们为了能够接收到事件，开启了一个定时器，每一秒发送一次事件：

```java
public class BGNativeExampleModule extends ReactContextBaseJavaModule {
    protected static final String TAG = BGNativeExampleModule.class.getSimpleName();
    private static final  String TestEventName = "TestEventName";
    private Timer timer;
    public BGNativeExampleModule(final ReactApplicationContext reactContext) {
        super(reactContext);
        //开启定时器
        TimerTask task = new TimerTask() {
            @Override
            public void run() {
                //发送事件
                WritableMap params = Arguments.createMap();
                params.putString("name", "Jack");
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(TestEventName, params);

            }
        };
        timer = new Timer();
        timer.schedule(task, 1000, 1000);
    }
}
``` 
 
在JS中，我们这里直接使用`DeviceEventEmitter`模块来监听事件。
 
```javascript
//接收事件
DeviceEventEmitter.addListener(BGNativeModuleExample.TestEventName, info => {
  console.log(info);
});
```

官方文档中，说也可以使用`Subscribable mixin`的addListenerOn方法来接收事件，其实它就是对`DeviceEventEmitter`一种封装。而且，在`es6`之后，不再支持`mixins`，所以我们直接使用DeviceEventEmitter接收事件比较好。

####8、生命周期
有时候，为了某些目的，我们需要监听ReactNative应用的生命周期。我们可以让原生模块实现`LifecycleEventListener`接口，然后使用`addLifecycleEventListener`注册一下监听。

```java
public BGNativeExampleModule(final ReactApplicationContext reactContext) {
    super(reactContext);
    //添加监听
    reactContext.addLifecycleEventListener(this);
}
```

实现`LifecycleEventListener`接口

```javascript
    @Override
    public void onHostResume() {
        Log.i(TAG, "onHostResume");
    }

    @Override
    public void onHostPause() {
        Log.i(TAG, "onHostPause");
        timer.cancel();
    }

    @Override
    public void onHostDestroy() {
        Log.i(TAG, "onHostDestroy");
        timer.cancel();
    }
```
 
这样，我们就可以监听ReactNative应用的生命周期了。

上面原生代码就编写好了，主要以代码实践为主，弥补官方文档中的一些不足，如果要需要了解更多的原生模块封装的知识，可以参考[原生模块](http://reactnative.cn/docs/0.22/native-modules-ios.html#content)，也可以参考官方的源代码。
 
##二、发布上线
####建立一个github仓库
在github上创建一个仓库`react-native-BGNativeModuleExample`，克隆到本地，并且创建一个`android`文件夹。

```sh
$ git clone https://github.com/liuchungui/react-native-BGNativeModuleExample.git
$ cd react-native-BGNativeModuleExample
$ mkdir android
```

####将Library复制到android文件夹下
我们首先进入前面创建的`nativemoduleexample`这个Library下，然后将这个文件目录下所有文件copy到`react-native-BGNativeModuleExample/android`目录下。

```
$ cp -R android/nativemoduleexample/* ~/github/react-native-BGNativeModuleExample/android
```

####发布到npm
这里请参考我前面写的[ReactNative之原生模块开发并发布——iOS篇](http://www.liuchungui.com/blog/2016/05/02/reactnativezhi-yuan-sheng-mo-kuai-kai-fa-bing-fa-bu-iospian/)中的`发布到npm`那一节的内容，当然如果你和我一样前面已经发布了`1.0.0`，只需要将`package.json`修改一个版本就好了，我这里修改为`2.0.0`，然后使用下面命令发布。

```
$ npm publish
+ react-native-nativemodule-example@2.0.0
```
这样，我们就成功发布到了[npmjs.org](npmjs.org)。

##三、添加Example，测试是否可用，添加README
请点击查看[ReactNative之原生模块开发并发布——iOS篇](http://www.liuchungui.com/blog/2016/05/02/reactnativezhi-yuan-sheng-mo-kuai-kai-fa-bing-fa-bu-iospian/)中的`添加Example，测试是否可用，添加README`这一部分内容，基本上一样的。

##参考：
[http://blog.csdn.net/dxpqxb/article/details/8659292](http://blog.csdn.net/dxpqxb/article/details/8659292)        
[原生模块](http://reactnative.cn/docs/0.25/native-modules-android.html#content)

