---
layout: post
title: "Git简单总结"
date: 2015-10-23 14:45:46 +0800
comments: true
tags: [git, git总结, git命令, 搭建git服务器, Mac环境下搭建Git服务器]
keywords: git, git总结, git命令, 搭建git服务器, Mac环境下搭建Git服务器
description: Mac环境下搭建git服务器，git命令总结
categories: git
---
这篇文章分为两部分，一是搭建git服务器，二是git命令，主要是记录了一下我搭建git服务器流程和用到的相关命令。
##一、Mac环境下搭建Git服务器
这里简单说一下Mac环境下通过git+ssh搭建服务器的流程。     
####1、打开远程登陆      
系统偏好设置 -> 共享 -> 远程登陆

####2、添加git用户     
这一步不加上也可以，但是为了更好的管理和安全着想，最好加上一个git用户     
系统偏好设置 -> 用户与群组 -> 添加名为git的用户

####3、初始化一个空仓库
在git用户目录下创建一个repos文件夹专门用来管理仓库

```
$ mkdir repos
$ cd repos
# 初始化一个空仓库
$ git init --bare test.git
```

####4、添加密钥     
在git服务端添加客户端的公钥后，以后git访问不需要密码了，下面是客户端与服务端的操作。      
客户端：     
使用`ssh-keygen`命令生成密钥，执行完后会生成`id_rsa`和`id_rsa.pub`两个文件，其中`id_rsa`是私钥，`id_rsa.pub`是公钥。客户端将`id_rsa.pub`文件交给git服务端就行了。         
服务端：         
将客户端的`id_rsa.pub`中的内容放到`/Users/git/.ssh/authorized_keys`文件中。主要，客户端每个公钥占用独立的一行，有时复制会出现问题，可以使用`cat id_rsa.pub >> /Users/git/.ssh/authorized_keys`命令。
<!-- more -->

####5、客户端使用      
到这一步，我们的git服务环境其实已经搭建好了，下面来使用。       
首先，我们需要知道服务端的用户和git项目的路径    

```  
$ whoami
git
$ pwd
/Users/git/repos
```
这里用户是git，路径是`/Users/git/repos/test.git`       
下面，我们就可以在客户端clone项目了。这里因为我是在本机测试，所以用的是localhost，一般都是用`服务器的ip或者域名`。

```
$ git clone user@localhost:/Users/user/repos/test.git
Cloning into 'test'...
warning: You appear to have cloned an empty repository.
Checking connectivity... done.
```
这里就说明服务器已经搭建好了。

遇到问题(这里是我在linux系统搭建时遇到的问题)：    
`remote: error: insufficient permission for adding an object to repository database ./objects`     
权限的问题，查看服务器对应的仓库的父文件夹是否属于git用户，git是否拥有可写权限


**linux系统搭建git服务器，请参考**[搭建Git服务器](http://www.liaoxuefeng.com/wiki/0013739516305929606dd18361248578c67b8067c8c017b000/00137583770360579bc4b458f044ce7afed3df579123eca000)

##二、Git命令
1、下面是git操作的简单流程，里面的命令都是经常用到的

```
#克隆某个仓库的代码
git clone https://github.com/chunguiLiu/TestLCGCocoapods.git
#进入TestLCGCocoapods，添加文件
cd TestLCGCocoapods
echo "test" > test.txt
git add test.txt
#提交文件，并添加日志为'add test.txt file'
git commit -m 'add test.txt file'
#推送到远程服务器
git push origin master
#修改文件，并推送到服务器
echo 'add test' >> test.txt
git add -update
git commit -m 'update file'
git push origin master
#打上版本号，其中-m参数后面是日志，'0.1.0'是版本号
git tag -m 'first tag' '0.1.0'
#将版本号推送到服务器
git push --tags
```

2、分支是git中一个很强大的功能，这里列出我曾经使用过的相关分支命令，也许你会用到，想了解更多分支的知识请进入[Git详解之三 Git分支](http://www.open-open.com/lib/view/open1328069889514.html)

```
#创建test分支
git branch test
#切换到test分支
git checkout test
#比较master和test两个分支
git diff master test
#查看当前分支
git branch
#删除分支
git branch -d test
#删除远程服务器的分支
git push --delete origin testBranch
```

3、查看git某个版本的内容
当我添加Cocoapods私有库的时候，想查看从pod某个版本下来的内容与我对应版本内容是否相同，这个时候，我怎么操作git？     
其实，git克隆下来的内容拥有所有版本内容，我们如果想查看某个tag版本的内容，可以使用`git checkout tag-version`命令，将这个版本当做一个分支来查看，只是这个时候它只是一个快照，我们不能修改代码。

```
#跳转到0.0.1版本
git checkout 0.0.1
```
如果我们想修改这个版本的内容时，那么我们可以通过创建一个新的分支，这个新的分支是以某个tag版本为准，可以在新的分支下修改代码

```
#以0.0.1版本创建一个分支newBranch
git checkout -b newBranch 0.0.1
```

##参考：

[搭建Git服务器](http://www.liaoxuefeng.com/wiki/0013739516305929606dd18361248578c67b8067c8c017b000/00137583770360579bc4b458f044ce7afed3df579123eca000)     
[开发者日常使用的 Git 命令](http://blog.jobbole.com/54184/)     
[Git基本命令行操作](http://www.cnblogs.com/lee0oo0/archive/2013/06/28/3161829.html)     
[github常用命令](http://www.cnblogs.com/winterIce/archive/2012/07/22/2603488.html)     
[Git详解之三 Git分支](http://www.open-open.com/lib/view/open1328069889514.html)    









