---
layout: post
title: "ubuntu下搭建vpn历程"
date: 2016-04-23 16:27:39 +0800
comments: true
tags: [vpn, ubuntu搭建vpn, unbutn]
keywords: vpn, ubuntu搭建vpn, unbutn
categories: iOS
---
去年四月份的时候，和同学一起买了一个香港的服务器，准备搭建一个vpn给自己翻墙用。当时，vpn搭建成功了，但是连上去之后，根本连不了google。后来，去咨询了一下盼哥，盼哥给我介绍了一款很出名的翻墙工具Shadowsocks。于是，到网上搜了一个教程，apt-get install安装，稍微配置一下，在本地电脑下载一个客户端，填写服务器和密码，在浏览器中输入google.com立马就出现了心动的页面，顿时整个人感觉神清气爽，觉得Shadowsocks真是个好东西。于是，使用Shadowsocks翻墙，用到了现在，一直感觉不错。不过，在使用途中，它也存在一定的不足，那就是命令行下无法翻墙，手机上体验不太好（我使用一次就不再使用了）。前几天，由于使用ReactNative开发安卓，在命令行下一定需要翻墙下载google的东西。于是乎，重整了一下vpn，最终还是以失败告终。后来，准备曲线救国，使用Shadowsocks和一些辅助工具进行全局翻墙，查找了网上的教程，搭建后都失败了。最终，在网上下载了一个vpn翻墙工具`VPN Unlimited`，搞定了自己的问题，但是有时间限制。

今天，按照同学发的一个链接教程重新整一下vpn，又以失败告终，而且VPN启动都启动不起来了，于是乎google到上面继续找教程，找到了一篇[vps ubuntu上搭建pptp服务](http://my.oschina.net/mn1127/blog/380941)，按照上面搭建，没想到成功了。
鉴于以上搭建的不容易，特此记录一下搭建步骤。
<!-- more -->

##1、卸载pptpd和iptables，重新安装pptpd

```
#卸载pptpd
$ apt-get autoremove pptpd
$ apt-get purge pptpd

#卸载iptables
$ apt-get autoremove iptables*
$ apt-get purge iptables*

#安装pptpd
$ apt-get install pptpd
```

##2、配置pptpd
####（1）首先，编辑pptpd.conf文件，设置localip和remoteip
```
$ vim /etc/pptpd.conf
```

查找到localip和remoteip，打开注释进行设置。将localip设置为你的vps的服务器公网ip，不知道可以通过ifconfig查看。remoteip是设置给VPN用户分配的IP段，我这里设置为10.100.0.2-100。

```
localip VPS_IP
remoteip 10.100.0.2-100
```

####（2）修改dns设置，设置为google的DNS
```
$ vim /etc/ppp/pptpd-options
```
查找到ms-dns，配置dns如下：

```
ms-dns 8.8.8.8
ms-dns 8.8.4.4
```

####（3）设置VPN的账号密码
编辑chap-secrets文件

```
$ vim /etc/ppp/chap-secrets
```
在chap-secrets文件中添加一行配置

```
#client           server       secret      IP address
 liuchungui       pptpd        123456          *
```

其中，liuchungui是VPN的用户名，使用的VPN服务类型是pptpd，密码是123456，*代表不限制IP
 
##3、启动pptpd服务
```
$ /etc/init.d/pptpd restart
```
 输入上面命令，如果提示`
  * Restarting PoPToP Point to Point Tunneling Server pptpd               [ OK ] `
  就说明启动成功了
  
##4、设置系统的ipv4的转发开关
```
$ vim /etc/sysctl.conf
```
编辑`/etc/sysctl.conf`文件，找到`net.ipv4.ip_forward=1`，把这行的注释打开并保存。    
运行：`sysctl -p` 让上面的修改立即生效。
  
##5、配置iptables
####（1）安装iptables

```
$ apt-get install iptables
```
####（2）添加一个NAT，这里特别注意：`eth1`是vps的ip网卡接口，可以通过ifconfig查看

```
$ iptables -t nat -A POSTROUTING -s 10.100.0.0/24 -o eth1 -j MASQUERADE
```
####（3）设置MTU，防止包过大

```
$ iptables -A FORWARD -s 10.100.0.0/24 -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1200
```
####（4）再添加一个NAT，`45.62.119.172`就是你的vps的公网ip

```
$ iptables -t nat -A POSTROUTING -s 10.100.0.0/24 -j SNAT --to-source 45.62.119.172
```
  
####（5）将iptables规则保存，令重启后规则不丢失：

```
$ iptables-save > /etc/iptables-rules
```
####（6）编辑网卡文件，加载网卡时自动加载规则

```
$ vim /etc/network/interfaces
```
在`interfaces`文件末尾加上：`pre-up iptables-restore < /etc/iptables-rules`

####（7）安装iptables配置持久化

```
$ apt-get install iptables-persistent
```
  
####（8）运行保存配置命令

```
$ service iptables-persistent start
```

##参考
[vps ubuntu上搭建pptp服务](http://my.oschina.net/mn1127/blog/380941)