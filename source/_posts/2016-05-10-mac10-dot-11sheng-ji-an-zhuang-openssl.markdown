---
layout: post
title: "Mac10.11升级安装openssl"
date: 2016-05-10 20:46:18 +0800
comments: true
keywords: [Mac10.11, openssl, openssl 安装, Mac10.11 openssl, Mac10.11 openssl 安装, Mac10.11 openssl 安装升级, Mac openssl 安装, Mac openssl 升级, Mac10.11 openssl 升级, Mac openssl 安装升级]
tags: Mac10.11, openssl, openssl 安装, Mac10.11 openssl, Mac10.11 openssl 安装, Mac10.11 openssl 安装升级, Mac openssl 安装, Mac openssl 升级, Mac10.11 openssl 升级, Mac openssl 安装升级
categories: Mac
---
一直想要升级Mac上的openssl，但是前面没弄成功，所以耽搁到现在。今天由于安装一个软件需要安装openssl到1.0.1版本以上，所以查了下资料，终于升级成功了，也算是还了前面[自建证书配置HTTPS服务器](http://www.liuchungui.com/blog/2015/09/25/zi-jian-zheng-shu-pei-zhi-httpsfu-wu-qi/)这篇博客的债。

<!-- more -->

首先，来看看我们的openssl的版本和目录

```sh
$ openssl version
OpenSSL 0.9.8zh 14 Jan 2016

$ which openssl
/usr/local/bin/openssl
```

通过上面的查看，明显我们的版本号太低了，于是google了下，找到了[http://apple.stackexchange.com/questions/126830/how-to-upgrade-openssl-in-os-x](http://apple.stackexchange.com/questions/126830/how-to-upgrade-openssl-in-os-x)。

按照上面的步骤，我们首先更新`homebrew`

```
$ brew update

Error: Cowardly refusing to `sudo brew update`
You can use brew with sudo, but only if the brew executable is owned by root.
However, this is both not recommended and completely unsupported so do so at
your own risk.
bogon:Downloads user$ brew update
Error: The /usr/local directory is not writable.
Even if this directory was writable when you installed Homebrew, other
software may change permissions on this directory. Some versions of the
"InstantOn" component of Airfoil or running Cocktail cleanup/optimizations
are known to do this.

You should probably change the ownership and permissions of /usr/local
back to your user account.
  sudo chown -R $(whoami):admin /usr/local

```
很不幸，我们在更新的时候遇到了一个错误，好在homebrew有错误提醒，我们按照提醒执行下面命令，继续安装。

```
$ sudo chown -R $(whoami):admin /usr/local
$ brew update
Updated Homebrew from e3986e9 to 21ce7a5.
==> Migrating Homebrew to v0.9.9
...
```
看到这个信息，就是成功的在更新了，这个过程可能比较久点。更新完之后，我们开始通过homebrew安装openssl。

```
$ brew install openssl

==> Downloading https://homebrew.bintray.com/bottles/openssl-1.0.2h.el_capitan.b
######################################################################## 100.0%
...
==> Summary
🍺  /usr/local/Cellar/openssl/1.0.2h: 1,691 files, 12M
```

当最后显示🍺那个标志，说明我们成功的将openssl安装到`/usr/local/Cellar/openssl/1.0.2h`。

不过，我们还有最后一步，那就是当我们使用openssl时，使用的是我们用homebrew新下载的openssl。为了达到这个目的，我们有两种方法。

第一种：    

将homebrew下载的openssl软链接到/usr/bin/openssl目录下。这里，我们先将它保存一份老的，然后再软链接新下载的。

```
$ mv /usr/bin/openssl /usr/bin/openssl_old
mv: rename /usr/bin/openssl to /usr/bin/openssl_old: Operation not permitted

$ ln -s /usr/local/Cellar/openssl/1.0.2h/bin/openssl /usr/bin/openssl
ln: /usr/bin/openssl: Operation not permitted
```

`Operation not permitted`提示没有权限操作，对`/usr/bin`目录下的东西，我已经遇到过几次这个问题了，于是继续google，在stackoverflow上找到了[Operation Not Permitted when on root El capitan (rootless disabled)](http://stackoverflow.com/questions/32659348/operation-not-permitted-when-on-root-el-capitan-rootless-disabled)。

重启系统，当启动的时候我们同时按下`cmd+r`进入Recovery模式，之后选择`实用工具` => `终端`，在终端输入如下命令，接口文件系统的锁定，并且重启电脑：

```
$ csrutil disable
$ reboot
```

最后，我们执行前面两个命令，查看版本。

```
$ mv /usr/bin/openssl /usr/bin/openssl_old
$ ln -s /usr/local/Cellar/openssl/1.0.2h/bin/openssl /usr/bin/openssl
$ openssl version
OpenSSL 1.0.2h  3 May 2016
```
这样，我们的openssl升级成功了。不过，为了安全起见，我还是重新启动电脑，然后重新开启了`csrutil`。

第二种：

在操作完前面一种方法之后，我发现了一个更简单的方式，那就是直接将openssl软链接到`/usr/local/bin/openssl`。

```
#如果/usr/local/bin/openssl下存在，则先删除 /usr/local/bin/openssl
$ rm /usr/local/bin/openssl

#将以前通过homebrew下载的1.0.2e版本的openssl链接到/usr/local/bin/openssl
$ ln -s /usr/local/Cellar/openssl/1.0.2e/bin/openssl /usr/local/bin/openssl

$ openssl 
OpenSSL 1.0.2e 3 Dec 2015

```

##总结
主要记录了安装openssl过程中遇到的一些问题，同时也知道当如果对`/usr/bin`类似文件目录无操作权限的时候怎么解锁文件系统。当然，最好是将命令通过ln链接到`/usr/local/bin`，这个目录下的权限苹果还是开放给我的。