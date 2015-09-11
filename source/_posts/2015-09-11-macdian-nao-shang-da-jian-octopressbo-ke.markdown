---
layout: post
title: "mac电脑上搭建octopress博客"
date: 2015-09-11 22:51:44 +0800
comments: true
categories: 
---
##mac电脑上搭建octopress博客
搭建octopress博客的文章很全很详细已经有很多了，我这里只简单记录下mac电脑上搭建octopress博客的步骤。
###1、搭建环境
```
git clone git://github.com/imathis/octopress.git octopress
cd octopress
gem install bundler
bundle install
rake install
```
遇到的问题：

1、`gem install bundler`失败了，需要更改一下`Gemfile`文件当中的源，将第一行`source "https://rubygems.org"` 更改成 `source "http://ruby.taobao.org/"`就行了。

2、如果安装的时候报`“You don't have write permissions for the /Library/Ruby/Gems/2.0.0 directory”`这样的错误，请加上sudo权限。

###2、将博客部署到github上
在github上创建一个username.github.io的仓库。
```
rake setup_github_pages
```
粘贴`username.github.io`仓库对应的url，例如我的就是`https://github.com/liuchungui/liuchungui.github.io.git`

3、生成博文
```
rake new_post['title']
```
生成新文章，文章在source/_post/目录下，文件名构成为时间和标题的拼音。

```
rake generate
rake preview
```
此时可以预览了，使用localhost:4000打开看效果，如果没有问题，则上传到github上

```
rake deploy
```
rake deploy会将octopress/public下的文件上传到你的仓库master分支下。
上传之后，将源代码上传到github仓库的source分支下

```
git add .
git commit -m 'add source file'
git push origin source
```