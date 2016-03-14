---
layout: post
title: "BGSession一个基于NSUserDefaults实现的轻量级本地数据存储"
date: 2016-03-04 16:35:38 +0800
comments: true
tags: [BGSession, NSUserDefaults, 轻量级数据存储]
keywords: BGSession, NSUserDefaults, 轻量级数据存储
categories: ios
---
[BGSession](https://github.com/liuchungui/BGSession)是一个基于NSUserDefaults实现的轻量级数据存储，你只需要简单的继承它，给它添加属性，设置属性的值，就能通过NSUserDefaults同步到本地。
<!-- more -->

## BGSession的由来
在昨天以前，对于一些轻量级数据，我一共使用过三种方案。

第一种，直接使用NSUserDefaults进行读取，代码如下：

```objc
    //写入
    [[NSUserDefaults standardUserDefaults] setValue:@"Jack" forKey:@"UserDefaults_userName"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    
    //读取
    NSString *userName = [[NSUserDefaults standardUserDefaults] valueForKey:@"UserDefaults_userName"];
```

第二种，数据归档，代码如下：

```
    //使用归档写入
    NSString *userName = @"Jack";
    NSString *filePath = [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject] stringByAppendingPathComponent:@"UserNameFile"];
    [NSKeyedArchiver archiveRootObject:userName toFile:filePath];
    
    //使用解归档读取
    userName = [NSKeyedUnarchiver unarchiveObjectWithFile:filePath];
```
    
第三种，建立一个全局的单例，然后给定相应的属性值，存储时的代码如下：

```
	//写入
    [BGGlobal sharedGlobal].userName = @"Jack";
    //写入文件，我使用的是将整个对象归档到一个文件当中
    [BGGlobal writeToFile];
    
    //读取
    NSString *userName = [BGGlobal sharedGlobal].userName;
```
    
 比较上面三种方案：    
 第一种我使用过之后就再也不怎么用了，有段时间几乎遗忘了它，因为使用它真的很麻烦，打出`[NSUserDefaults standardUserDefaults]`已经感觉很长了，后面还需要输入一个自己定义的key值，虽然可以全局定义常量，但是当常量够多的时候，也不能一时找到，而且设置值之后，如果要写入磁盘，还需要使用`[[NSUserDefaults standardUserDefaults] synchronize]`同步到本地；读取时和写入类似，需要一个key值。
 
 第二种，数据归档和第一种一样，存取时比较麻烦，而且因为归档的时候需要不停的读取文件，性能也不好。
 
 第三种，在全局单例实现`NSCoding`协议，只需要添加属性值，就可以使用点语法直接存取，存取非常的方便。存储本地时，和`[[NSUserDefaults standardUserDefaults] synchronize]`类似，使用`[BGGlobal writeToFile]`全局归档写入文件。
 
 比较这三种方案，我选择了第三种。第二种，直接舍弃；第一种虽然在性能比第二种更优，但是使用不是很方便，况且我们这是存储轻量级数据，性能差异根本看不出来什么。
 
 但，在使用过程中，我们遇到了一些问题，就是`[BGGlobal writeToFile]`会忘记写，从而造成了bug。而且，在整个工程项目中`[BGGlobal writeToFile]`出现的次数特别的多，这一步是否可以优化掉？
 
 后来，一致商议，我们项目中将全局单例的global中归档写入文件的方式替换成NSUserDefaults的存储方式，然后在内部实现了同步本地的操作。这样只要我们在外面使用设置新的值时，它会自动同步到本地，而且性能方面更佳。
 
 但是，在使用过一段时间之后，我发现并不是很方便，因为在使用的时候，##每添加一个字段都需要做如下两步##。
 
```
 //1、定义一个常量来作为NSUserDefaults的key
 static NSString *const kSessionUserName = @"kSessionUserName";
 //2、在全局单例内部实现getter和setter方法
 - (void)setUserName:(NSString *)userName{
    [self setValue:userName forKey:kSessionUserName];
 }
 - (NSString *)userName{
    return [self getValueForKey:kSessionUserName];
 }
```
 
 这些步骤我们是否可以完全省略呢？    
 
 在一次我自己做项目的时候，我使用全局单例舍弃NSUserDefaults进行存储，仍然使用的是归档的形式，而且那个全局单例继承的是[jastor](https://github.com/elado/jastor)，它内部自己实现了归档协议，我只需要每次使用的时候，多添加`[BGGlobal writeToFile]`同步到本地就行了，比前面使用NSUserDefaults方便很多。
 
 但是，我一直都认为有更好的实现方案，终于在看runtime和KVO东西的时候想到了一种方案。于是，立马回家写了一个实现了[BGSession](https://github.com/liuchungui/BGSession)。
 
##BGSession实现原理
 BGSession是一个全局单例，主要采用的是KVC/KVO和Runtime进行实现的。使用BGSession作为轻量级数据存储时，只需要继承BGSession，然后在BGSession的派生类添加相关的属性。当给这些属性设置新的值后，BGSession会监听到属性值的变化，然后使用KVC自动将它同步到NSUserDefaults。这样，存取时，我们就可以当做使用单例一样使用，简单方便。
 
##Github地址
[https://github.com/liuchungui/BGSession](https://github.com/liuchungui/BGSession)

