---
layout: post
title: "CocoaPods创建私有Pods"
date: 2015-10-19 21:54:54 +0800
comments: true
tags: [cocoapods, private pods, cocoapods私有源]
keywords: cocoapods, private pods, cocoapods私有源
categories: mac
---
创建Pod私有源步骤：    
1、创建一个git仓库，用来存放Podspec    
2、添加私有的repo到CocoaPods    
3、创建项目组件仓库，制作Podspec，并且推送到你创建的私有repo     
4、使用Pod，在Podfile添加私有源来搭建项目    
<!-- more --> 

下面，跟着我一步一步来制作Pod私有源，并且使用私有源当中框架来搭建项目。
###1、创建一个git仓库，用来存放Podspec
这里我直接是使用github仓库[https://github.com/liuchungui/first.git](https://github.com/liuchungui/first.git)      
当然如果是公司需要建立组件库，放在公司的git服务器上，这样就不会公开了。如果公司没有git服务器，不急，搭建git服务器很简单，可以参照我的[Git简单总结](http://www.liuchungui.com/blog/2015/10/23/gitzong-jie/)来搭建。

###2、添加私有的repo到CocoaPods
主要命令是`pod repo add REPO_NAME SOURCE_URL`。其中，REPO_NAME是私有repo的名字，随便你取，以后公司内部的组件对应的podspec都可以推送到这个repo中；SOURCE_URL是你git仓库的链接。

```
$ pod repo add liuchungui https://github.com/liuchungui/first.git
$ ls ~/.cocoapods/repos  
liuchungui	master
```
这时，你会发现有两个文件夹`liuchungui`和`master`，master是Cocoapods官方的repo，而liuchungui就是我刚刚创建的。进入liuchungui文件夹查看，你会发现它是clone了一份`https://github.com/liuchungui/first.git`。

###3、制作Podspec，并且推送到你创建的私有repo
CocoaPods本身就是用来管理公共库和解决它们之间依赖的一套解决方案，这里我就以我写的一个框架[BGNetwork](https://github.com/liuchungui/BGNetwork)的Podspec制作为例。      
1、在github上创建一个空的仓库，克隆到本地     
`git clone https://github.com/liuchungui/BGNetwork`     
2、在本地使用创建项目，然后写框架，框架写完了之后，提交到github，并打上版本号。

```
git add .
git commit -m 'add file'
git push origin master
git tag -m 'add tag' '0.1.2'
git push --tags
```
3、我们开始制作Podspec文件。    
BGNetwork是一个基于AFNetworking的网络框架，它主要的源文件都在BGNetwork/BGNetwork路径下。我们将它放在CocoaPods给第三方使用，主要是将这个文件夹下的源文件加载到第三方的项目中以供使用，那么Podspec可以这样写。

```
Pod::Spec.new do |spec|
  #项目名称
  spec.name         = 'BGNetwork'
  #版本号
  spec.version      = '0.1.1'
  #开源协议
  spec.license      = 'MIT'
  #对开源项目的描述
  spec.summary      = 'BGNetwork is a request util based on AFNetworking'
  #开源项目的首页，这个如果没有，可以随便写
  spec.homepage     = 'https://github.com/chunguiLiu/BGNetwork'
  #作者信息
  spec.author       = {'chunguiLiu' => 'chunguiLiu@126.com'}
  #项目的源和版本号，这个不能乱写
  spec.source       = { :git => 'https://github.com/chunguiLiu/BGNetwork.git', :tag => '0.1.1' }
  #源文件，这个就是供第三方使用的源文件
  spec.source_files = "BGNetwork/*"
  #适用于ios7及以上版本
  spec.platform     = :ios, '7.0'
  #使用的是ARC
  spec.requires_arc = true
  #依赖AFNetworking2.0
  spec.dependency 'AFNetworking', '~> 2.0'
end
```

4、验证并推送到服务器      
在推送前，我们先验证Podspec，验证的时候是验证BGNetwork.podspec文件，所以我们需要保证进入的目录和BGNetwork.podspec同级的      
`$ pod lib lint`     
注意：验证的时候，会获取BGNetwork.podspec文件中的spec.source来获取git服务器上面对应版本的代码，然后再找到spec.source_files中的源代码，通过xcode命令行工具建立工程并且进行编译。所以这一步的过程会比较久，如果没有编译没有错误，就验证通过。

如果没有错误和警告我们就可以推送到服务器了，推送使用的命令是`pod repo push REPO_NAME SPEC_NAME.podspec`，它也会先验证，然后再推送。           
`$ pod repo push liuchungui BGNetwork.podspec`   
如果没有错误，但是有警告，我们就将警告解决，也可以加`--allow-warnings`来提交     
`$ pod repo push liuchungui BGNetwork.podspec --allow-warnings`     
如果有错误，我们可以去查看错误信息对应下的Note信息。

5、搜索我们的框架
到这一步，我们就可以通过`pod search BGNetwork`来搜索了，搜索到了说明我们私有源建立成功。

```
$ pod search BGNetwork
-> BGNetwork (0.1.2)
   BGNetwork is a request util based on AFNetworking
   pod 'BGNetwork', '~> 0.1.2'
   Homepage: https://github.com/chunguiLiu/BGNetwork
   Source:   https://github.com/chunguiLiu/BGNetwork.git
   Versions: 0.1.1, 0.1.0 [liuchungui repo] - 0.1.2, 0.1.1 [master repo]
```
由上面的搜索知道，BGNetwork在liuchungui和master两个repo中都存在。
###4、使用Pod，在Podfile添加私有源来搭建项目  
使用时，在Podfile文件中添加**本地私有源和官方源**。如果没有添加本地私有源，它默认是用官方的repo，这样找不到本地的Pod；如果只是设置了本地私有源，就不会再去官方源中查找。
 下面是Podfile内容
   
   ```
   #官方Cocoapods的源
   source 'https://github.com/CocoaPods/Specs.git'
   #本地私有源
   source 'https://github.com/liuchungui/first.git'
   platform :ios, '7.0'
   pod 'BGNetwork', '~> 0.1.1'
  ```
####注意
1、[https://github.com/liuchungui/first.git](https://github.com/liuchungui/first)是用来专门存储Podspec文件，类似官方的[Cocoapods仓库](https://github.com/CocoaPods/Specs)。而[BGNetwork](https://github.com/liuchungui/BGNetwork)是我们的项目组件，所以我们这里有两个git仓库。一般，存储Podspec的first仓库一个就行了，而项目组件的话会有多个。   
  
2、途中遇到了几次问题，就是pod repo push不上去，显示没有找到对应文件，后来发现是版本的问题，没有打上版本号或者Podspec中版本错了。所以我们在维护一个框架时，修改框架之后，push到git服务器之后先打上tag，然后再修改podspec文件中的版本，最后push到对应的pod repo中。

3、若是在框架当中，存在不同的文件夹，请使用`subspec`。如果不同文件夹之间的文件有相互导入的情况，请将被导入的头文件设置为`public_header_files`，并且通过`dependency`设置依赖，具体可以参考[AFNetworking的podspec](https://github.com/AFNetworking/AFNetworking/blob/master/AFNetworking.podspec)文件。

4、若是需要提交给官方，请使用 

```
pod trunk register youremail
查看信息
pod trunk me
将对应的pod推送到服务器
pod turnk push
```

5、使用`pod install`时，它首先会更新整个官方的源，而Cocoapods每天都有很多人提交，所以更新比较慢。所以，建议每过一段时间更新一下官方库，平常的时候，咱们可以在install或update加一个参数不用它更新。

```
$ pod install --verbose --no-repo-update
$ pod update --verbose --no-repo-update
```

####参考
[Private Pods](https://guides.cocoapods.org/making/private-cocoapods.html)     
[使用Cocoapods创建私有podspec](http://blog.wtlucky.com/blog/2015/02/26/create-private-podspec/)     
[CocoaPods详解之----使用篇](http://blog.csdn.net/wzzvictory/article/details/18737437?utm_source=tuicool)    