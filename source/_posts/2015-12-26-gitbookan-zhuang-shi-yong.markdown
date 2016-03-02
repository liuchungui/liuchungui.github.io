---
layout: post
title: "Gitbook安装使用"
date: 2015-12-26 17:15:07 +0800
comments: true
tags: [Gitbook, Gitbook安装使用]
keywords: Gitbook, Gitbook安装使用
categories: Gitbook
---

> GitBook 是一个基于 Node.js 的命令行工具，可使用 Github/Git 和 Markdown 来制作精美的电子书。

在这篇博客中，记录了一下gitbook的安装使用，更详细的使用请查看下面内容：	
gitbook详细使用文档：[help.gitbook.com](help.gitbook.com)		
gitbook官网:[https://www.gitbook.com](https://www.gitbook.com)	
github地址:[https://github.com/GitbookIO/gitbook](https://github.com/GitbookIO/gitbook)
###1、安装
首先到[nodejs](http://nodejs.cn/)下载，安装Node.js的包管理器npm。
然后，通过`sudo npm install -g gitbook-cli`命令安装gitbook
<!-- more -->
###2、初始化gitbook
创建一个文件夹，然后初始化

```
mkdir test
gitbook init
```
初始化之后会有两个文件README.md和SUMMARY.md,README.md 是作品的介绍，SUMMARY.md 是作品的目录结构，里面要包含一个章节标题和文件索引的列表。

下面是一个SUMMARY.md文件的内容：

```
# Summary

This is the summary of my book.

* [section 1](section1/README.md)
    * [example 1](section1/example1.md)
    * [example 2](section1/example2.md)
* [section 2](section2/README.md)
    * [example 1](section2/example1.md)
```
在这里，我们可以先创建对应的文件夹，然后在里面编辑对应的内容，之后更新SUMMARY.md这个目录文件；如果在编辑之前我们已经确定好了内容标题和目录，也可以先编辑SUMMARY.md文件，然后通过`gitbook init`来初始化一遍，它会自动创建文件目录和对应的md文件。

###3、编辑内容，并查看
初始化书以后，我们就可以对我们的内容进行编辑了。
例如：
我要将本篇博客放入目录为gitbook下，首先在test目录建立一个gitbook文件夹，然后建立一个`gitbook安装使用.md`文件，目录如下：

```
|____gitbook
| |____gitbook安装使用.md
|____README.md
|____section1
| |____example1.md
| |____example2.md
| |____README.md
| |____test.md
|____section2
| |____example1.md
| |____README.md
|____SUMMARY.md
```
之后，我们像写博客一样，使用markdown语言编辑`gitbook安装使用.md`中的内容。
编辑完之后，需要将`gitbook安装使用.md`这篇文章放入SUMMARY.md目录中。

```
# Summary
* [gitbook]
    * [gitbook安装使用](gitbook/gitbook安装使用.md)
* [section 1](section1/README.md)
    * [example 1](section1/example1.md)
    * [example 2](section1/example2.md)
* [section 2](section2/README.md)
```
这样，就加入了`gitbook安装使用.md`这篇文章。之后，可以使用下面命令启动一个本地web服务，来预览本地的内容。

```
gitbook serve
```
这个时候，简洁、优雅的界面就出来了。
![](http://ww1.sinaimg.cn/large/7746cd07gw1eynt17tm6yj20zh0ey0ua.jpg)

注意：

* 在查看的时候没有看到刚刚加入的文章，查看一下`SUMMARY.md`是否添加
* 在预览的时候能看到文章，但是点击不起作用，查看是否目录正确 

**如果想将gitbook放到web服务器作为网站浏览，先使用gitbook build命令，之后会生成静态网页到_book目录下，只要将_book目录copy到web服务器上就行了。**

###4、发布电子书gitbook官网
到[gitbook官网](  https://www.gitbook.com/)创建一个账号，创建一本`test`电子书，创建电子书的时候，gitbook会创建git仓库https://git.gitbook.liuchungui/test.git。

然后下载[gitbook editor](https://www.gitbook.com/editor)，登陆账号，将电子书clone一份下来，将前面新建电子书将前面编辑的内容拖到这个电子书下，然后同步到官网就可以看到内容了，例如我的[test](https://liuchungui.gitbooks.io/test/content/)。

上面的操作我们也可以用命令行进行操作。先在官网建立一个电子书，然后clone下来，之后编写我们的电子书内容和目录，然后使用[git命令](http://www.liuchungui.com/blog/2015/10/23/gitzong-jie/)将内容Push到git仓库就行了。

###5、导出电子书
其实，上面建立的`test`已经在官网上可以进行电子书下载了，有三种格式`PDF`、`EPUB`、`MOBI`。
而在本地，使用下面命令导出

```
pdf [options] [source_dir] 构建 pdf 格式的电子书
epub [options] [source_dir] 构建 ePub 格式的电子书
mobi [options] [source_dir] 构建 mobi 格式的电子书
```
如果导出失败，需要我们下载[Calibre](http://calibre-ebook.com/)进行电子书转换。

###gitbook的相关命令
```
build [options] [source_dir] 根据文档目录构建书籍
serve [options] [source_dir] 构建并且提供书籍的 web 托管
install [options] [source_dir] 安装 GitBook 插件
pdf [options] [source_dir] 构建 pdf 格式的电子书
epub [options] [source_dir] 构建 ePub 格式的电子书
mobi [options] [source_dir] 构建 mobi 格式的电子书
init [source_dir]      根据 SUMARRY.md 文件的内容生成相应的目录和文件
publish [source_dir]   如果已绑定 GitBook.io，该命令可以直接发布书籍

-h, --help     输出命令的使用说明
-V, --version  输出程序的版本号
```
###总结
gitbook操作其实就分为两个方面内容，一个是建立git仓库对内容进行管理，另外一个就是使用markdown对内容进行编辑，然后使用SUMARRY.md生成书的目录。	
而gitbook这么优雅大方的页面，我们喜欢的话，完全可以将它做成我们的技术博客。而它还具有简单标题检索功能，我甚至想过将它做成一个api接口管理页面。

###参考：
[Gitbook 的使用和常用插件](http://zhaoda.net/2015/11/09/gitbook-plugins/)	
[Mac下GitBook制作电子书](http://liaoer.net/2015/04/30/Mac%E4%B8%8BGitBook%E5%88%B6%E4%BD%9C%E7%94%B5%E5%AD%90%E4%B9%A6/)	
[使用GitBook](http://blog.windrunner.info/app/gitbook-tutorial.html)	