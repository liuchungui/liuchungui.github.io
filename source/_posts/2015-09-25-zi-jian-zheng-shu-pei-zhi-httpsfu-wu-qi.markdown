---
layout: post
title: "自建证书配置HTTPS服务器"
date: 2015-09-25 11:24:02 +0800
comments: true
tags: [HTTPS, openssl]
keywords: HTTPS,openssl,自建证书,自建CA证书
categories: web
---

###说明
1、写这篇博客的初衷是因为最近iOS9出来了，苹果官方默认要求使用HTTPS，所以自己想整一个HTTPS服务器，也想好好了解一下HTTPS通信，也知道了HTTPS其实就是在HTTP的基础上加上了SSL/TLS。具体想了解SSL/TLS原理的请浏览[SSL/TLS协议运行机制的概述](http://www.ruanyifeng.com/blog/2014/02/ssl_tls.html)和[SSL/TLS原理详解](http://segmentfault.com/a/1190000002554673)。中途看了很多博客，也花了不少时间，所以想记录一些东西。

2、这篇博客的内容主要是讲升级openssl、如何自己创建证书、配置证书到服务器和自建CA。其中对证书不太了解的，可以看[数字证书及CA的扫盲介绍](http://kb.cnblogs.com/page/194742/)这篇文章。本篇博客其中第2步和第3步已经重复，只需要选择其中一步操作就可以搭建HTTPS服务器，当然搭建都是不受信任的，如果是架设网站还是需要到权威的CA机构申请证书。本来还有生成iOS客户端的证书和使用证书连接服务器相关的内容，由于篇幅的原因就把它放在下一篇吧。

3、本人使用了Mac10.10.5和Ubuntu 14.04.1进行配置搭建，本篇博客主要以Unbuntu 14.04.1系统为主。而本人这个Ubuntu 14.04.1是阿里云一键安装的，而且没有更改里面的服务器设置，所以诸多的配置可能与一般Linux系统不太相同（与我电脑上的Linux mint就很大不同）。不过，我会在最后说明一下Mac和Linux配置一些不同的地方，其实都是一些相关路径的不同。当然，有可能你的Apache安装路径与我说的几种路径都不同，没关系，对照着修改也应该没什么问题。
<!-- more -->



###1、安装升级openssl
#####首先，查看下当前设备的openssl版本，如果版本在openssl1.0.1g以上，请略过    

```
openssl version -a
#OpenSSL 1.0.1f 6 Jan 2014
```

如果是处于`1.0.1-1.0.1f`的版本，那就赶快升级到`1.0.1g`版本以上吧！因为这些版本存在漏洞，详情请见[关于OpenSSL“心脏出血”漏洞的分析](http://drops.wooyun.org/papers/1381)

从上面信息可以看出我们的系统版本是1.0.1f，openssl需要升级，那我们先来下载源代码     

```
wget http://www.openssl.org/source/openssl-1.0.1g.tar.gz     
```
下载完之后，解压并进行安装    

```
tar -zxvf openssl-1.0.1g.tar.gz     	
cd  openssl-1.0.1g		   
./config shared zlib		    
make && make install		  
```

安装的过程中，碰到了一个问题
make: *** [install_docs] Error 255
解决这个问题请使用`make install_sw`安装，详情见[https://github.com/openssl/openssl/issues/57](https://github.com/openssl/openssl/issues/57)

#####随后，进行相关的设置

```
#修改历史的OpenSSL文件设置备份
mv /usr/bin/openssl /usr/bin/openssl.old
mv /usr/include/openssl /usr/include/openssl.old

#设置软连接使其使用新的OpenSSL版本 刚刚安装的OpenSSL默认安装在/usr/local/ssl
ln -s /usr/local/ssl/bin/openssl /usr/bin/openssl
ln -s /usr/local/ssl/include/openssl /usr/include/openssl

#更新动态链接库数据
echo "/usr/local/ssl/lib" >> /etc/ld.so.conf
ldconfig -v
```

最后查看一下版本

```
openssl version
OpenSSL 1.0.1g 7 Apr 2014
```
1.0.1g版本安装成功

###2、创建用私钥签名的证书，配置到Apache服务器
#####首先，生成私钥，创建请求证书，使用私钥对证书进行签名
生成私钥    
`openssl genrsa -des3 -out private.key 2048`   
-des3代表加上了加密，后面的2048是代表生成的密钥的位数，1024已经不是很安全，详情请见[互联网全站HTTPS的时代已经到来](http://get.jobdeer.com/1607.get)      

生成证书请求     
`openssl req -new -key private.key -out server.csr`    
这一步需要填写一些信息，其中`Common Name (e.g. server FQDN or YOUR name) []`这个需要填写你的域名或服务器地址。

生成服务器的私钥，去除密钥口令     
`openssl rsa -in private.key -out server.key`     

使用私钥为证书请求签名，生成给服务器签署的证书，格式是x509的PEM格式    
`openssl x509 -req -in server.csr -out server.crt -outform pem -signkey server.key -days 3650`   
-outform pem指定证书生成的格式，默认是pem，所以这个命令也可以写作成`sudo openssl x509 -req -in server.csr -out server.crt -signkey server.key -days 3650`。

将证书copy到Apache配置路径下

```
sudo  mkdir /alidata/server/httpd/conf/ssl
cp server.key /alidata/server/httpd/conf/ssl/server.key
cp server.crt  /alidata/server/httpd/conf/ssl/server.crt
```

#####其次，配置Apache服务器   
编辑/alidata/server/httpd/conf/httpd.conf文件

```
#LoadModule ssl_module modules/mod_ssl.so
#LoadModule socache_shmcb_module modules/mod_socache_shmcb.so
#Include conf/extra/httpd-ssl.conf
```
将这三行前面的#去掉

编辑`/alidata/server/httpd/conf/extra/httpd-ssl.conf`文件，找到SSLCertificateFile、SSLCertificateKeyFile，修改它们两对应的文件

```
SSLCertificateFile "/alidata/server/httpd/conf/ssl/server.crt"
SSLCertificateKeyFile "/alidata/server/httpd/conf/ssl/server.key"
```

编辑`/alidata/server/httpd/conf/vhosts/phpwind.conf`文件，这里我没有更改阿里云的配置，如果你不是阿里云服务器，找到对应的`httpd/conf/extra/httpd-vhosts.conf`文件进行修改。这个文件我主要加了下面的内容：

```
<VirtualHost *:443>
        SSLCertificateFile    /alidata/server/httpd/conf/ssl/server.crt
        SSLCertificateKeyFile /alidata/server/httpd/conf/ssl/server.key
        ServerName 182.92.5.161
        DocumentRoot /alidata/www
</VirtualHost>
```

最后，咱们重启Apache服务器，输入链接查看是否配置成功。

###3、自建CA，用CA证书进行签名，配置到Apache服务器
#####第一步、使用CA.sh创建CA根证书
修改openssl的配置文件`sudo vim /usr/local/ssl/openssl.cnf`，修改`default_bits=1024`为`default_bits=2048`，使其openssl加密使用2048位，原因前面已经说过。

随后创建一个目录，并且将生成CA证书的脚本CA.sh复制到这个目录

```
mkdir ca
cd ca
cp /usr/local/ssl/misc/CA.sh CA.sh
```

CA.sh这个脚本如果找不到，可以使用 `openssl version -a `查看openssl对应的目录，而CA.sh一般就在这个目录的子目录misc目录下。

之后执行`./CA.sh -newca`命令    
CA.sh会使用`/usr/local/ssl/openssl.cnf`中的配置来创建私钥和证书，这正是我们第一步为啥需要修改这个文件的原因。

创建CA证书过程中，不输入信息，直接回车，填写加密私钥的密码和生成CA证书的相关信息。

创建完之后会生成demoCA目录。这个目录有

```
cacert.pem  certs  index.txt       index.txt.old  private
careq.pem   crl    index.txt.attr  newcerts       serial
```

其中cacert.pem是CA的证书，private存放CA的私钥，newcerts存放CA签名的备份。到这里，我们的CA已经建好了，下面我们可以通过CA来对我们的证书进行签名了。

#####第二步、使用CA根证书为服务器证书签名

```
#生成私钥
sudo  openssl genrsa -des3 -out private.key 2048
#生成证书请求
sudo openssl req -new -key private.key -out server.csr
#生成服务器的私钥，去除密钥口令
sudo openssl rsa -in private.key -out server.key
#使用CA进行签名，生成server.crt
cp server.csr newreq.pem
./CA.sh -sign
mv newcert.pem server.crt
或者上面三步都不需要，直接使用下面一步
openssl ca -in server.csr -out server.crt
```
更多openssl ca 命令请见[OpenSSL命令--ca](http://blog.csdn.net/as3luyuan123/article/details/13346613)

#####第三步、配置服务器：

```
mkdir ssl
cp server.crt ssl/server.crt
cp server.key ssl/server.key
cp demoCA/cacert.pem ssl/ca.crt
cp -r ssl /alidata/server/httpd/conf/
```

编辑`/alidata/server/httpd/conf/extra/httpd-ssl.conf`文件，找到SSLCertificateFile、SSLCertificateKeyFile、SSLCACertificatePath、SSLCACertificateFile进行修改

```
# 指定服务器证书位置
SSLCertificateFile "/alidata/server/httpd/conf/ssl/server.crt"
# 指定服务器证书key位置
SSLCertificateKeyFile "/alidata/server/httpd/conf/ssl/server.key"
# 证书目录
SSLCACertificatePath "/alidata/server/httpd/conf/ssl"
# 根证书位置
SSLCACertificateFile "/alidata/server/httpd/conf/ssl/ca.crt"
```
修改vhost配置`vim /alidata/server/httpd/conf/vhosts/phpwind.conf`

```
<VirtualHost *:443>
        SSLCertificateFile    /alidata/server/httpd/conf/ssl/server.crt
        SSLCertificateKeyFile /alidata/server/httpd/conf/ssl/server.key
        SSLCACertificatePath /alidata/server/httpd/conf/ssl
        SSLCACertificateFile /alidata/server/httpd/conf/ssl/ca.crt
        ServerName 182.92.5.161
        DocumentRoot /alidata/www
</VirtualHost>
```

最后，咱们重启Apache服务器，在浏览器输入链接查看是否配置成功。可以在浏览器上查看证书信息，与第二步不同之处在于此时的证书有两个。

###最后，与Mac和寻常Linux系统一些区别
#####一、与MAC的几点不同
1、首先安装openssl，参考我的[Mac10.11升级安装openssl](http://www.liuchungui.com/blog/2016/05/10/mac10-dot-11sheng-ji-an-zhuang-openssl/)    
2、Mac上对应的Openssl的路径是`/System/Library/OpenSSL/`    
3、Mac上对应的Apache的路径是`/etc/apache2/`    
4、Mac上重启服务器使用`/usr/sbin/apachectl restart`，阿里云服务器使用`/etc/init.d/httpd restart`或者`service httpd restart`     
5、Mac上vhost配置的路径是`/etc/apache2/extra/httpd-vhosts.conf`

#####二、与寻常Linux系统的不同
主要借鉴[MacOS openssl下生成建立CA并生成服务器和客户端证书方法](http://m.blog.csdn.net/blog/whyliu_/41749521)这篇文章     
1、linux上Apache的路径是`/usr/local/apache`    
2、linux上vhost配置的路径是`/usr/local/apache/conf/extra/httpd_vhosts.conf`

###总结
1、对HTTPS的理解    
它的基本原理是服务器拥有一个私钥，客户端拥有公钥，当然它们是使用证书管理的。每次通信它们通过证书进行身份认证。身份认证之后客户端发送一个“对话密钥”给服务器。传输“对话密钥”时，客户端公钥通过不对称加密算法进行加密了的，只有服务器才能解密。然后双方使用这个"对话密钥"对内容进行对称加密，双方之间传输内容。

2、对openssl、SSL/TLS的相关理解    
openssl是一套工具，它是一个开源库，可以对相关内容进行加密和解密，也可以生成证书并且进行数字签名。它创建的x509证书有PEM和DER两种编码，而且它们还可以导出p12文件。它使用的加密算法有对称加密，也有不对称加密。

3、HTTPS相关理论知识博客，值得细读    
[OpenSSL 与 SSL 数字证书概念贴](http://segmentfault.com/a/1190000002568019)    
[SSL/TLS协议运行机制的概述](http://www.ruanyifeng.com/blog/2014/02/ssl_tls.html)    
[SSL/TLS原理详解](http://segmentfault.com/a/1190000002554673)


###参考：
[https介绍与环境搭建](http://www.yezhongqi.com/archives/1377.html)    
[OpenSSL常用命令](http://myswirl.blog.163.com/blog/static/5131864220071014102353799/)    
[OpenSSL命令---CA.pl](http://blog.csdn.net/as3luyuan123/article/details/13344757)    
[MacOS openssl下生成建立CA并生成服务器和客户端证书方法](http://m.blog.csdn.net/blog/whyliu_/41749521)     
[mac中apache开启https功能，本地发布安装app](http://blog.csdn.net/zhu410289616/article/details/46566073)    
[TLS/HTTPS 证书生成与验证](http://www.cnblogs.com/kyrios/p/tls-and-certificates.html)     
[OpenSSL小结](http://www.cnblogs.com/phpinfo/archive/2013/08/09/3246376.html)        
[利用openssl进行RSA加密解密](http://www.cnblogs.com/alittlebitcool/archive/2011/09/22/2185418.html)    
[DER 和 PEM 格式](http://blog.sina.com.cn/s/blog_a9303fd90101jmtx.html)
