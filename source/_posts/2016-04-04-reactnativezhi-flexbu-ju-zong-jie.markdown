---
layout: post
title: "ReactNative之Flex布局总结"
date: 2016-04-04 18:35:53 +0800
comments: true
tags: [ReactNative, react-native, Flex布局, Flex]
keywords: ReactNative, react-native, Flex布局, Flex
categories: ReactNative
---
从二月份开始学习ReactNative到现在已经有两个月了，零碎的记录了很多笔记，一直想写一些ReactNative相关的东西，奈何感觉自己学习的还比较浅陋，而且笔记比较杂乱，不知从何而起，所以迟迟没有动笔。清明三天假，决定无论如何都得整一篇出来。本来是想整一篇ReactNative布局篇的，但是看看那么多布局属性，自己对CSS又不是特别熟悉，布局篇从何谈起？所以，专门拿出ReactNative中布局比较重要的一个点Flex布局来做下总结，算是开启ReactNative篇章。

Flex是Flexible Box的缩写，意为“弹性布局”，2009年它由W3C提出了一种新的网页布局方案。而FaceBook将这个布局也应用到React和ReactNative两个项目当中。而在ReactNative当中，网页的有些属性和属性的值并不支持，下面来看看ReactNative当中支持的属性。（如果对于Flex布局不太了解的同学，可以看看[Flex 布局教程：语法篇](http://www.ruanyifeng.com/blog/2015/07/flex-grammar.html)）

<!-- more -->

##一、容器属性：
ReactNative支持的容器属性有flexDirection、flexWrap、justifyContent和alignItems。
####1、 flexDirection属性
flexDirection属性决定了主轴的方向，它有两个值：

* row: 主轴为水平方向，起点在左端
* column:  主轴为垂直方向，起点在顶部

####2、flexWrap属性
flexWrap属性定义一条轴线排不下时是否折行。它有两个值，分别是'wrap'和'nowrap'，分别代表支持换行和不支持换行，默认是'nowrap'。

####3、justifyContent属性
主轴的对齐方式，默认为'flex-start'，它的值有五个：

* flex-start：主轴起点对齐
* flex-end：主轴终点
* center：居中
* space-between：两端对齐，项目之间的间隔都相等
* space-around: 每个项目两侧的间隔相等。项目之间的间隔比项目与边框的间隔大一倍。

####4、alignItems属性
交叉轴的对齐方式，默认为'stretch'，它有四个值：

* flex-start: 交叉轴的起点对齐
* flex-end: 交叉轴的终点对齐
* center: 交叉轴的中心对齐
* stretch: 容器中的所有项目拉伸填满整个容器

##二、项目属性
####1、flex属性
是否让当前的视图尽量占用更大的空间，这个属性可能使项目属性justifyContent失效。有两个值0和1，0代表否，1代表是，默认为0。

###2、alignSelf属性
允许单个项目在交叉轴方向上与其他项目不一样的对齐方式，可覆盖alignItems属性，它的值有五个，除了'auto'，其他都与alignItem属性完全一致，默认为'auto'。



##后话
在刚开始接触ReactNative的时候，对于我这么一个从未有过前端开发的iOS开发程序员，两个地方直接让我懵了，一是里面的语法，另外一个就是Flex布局。布局当中其它例如bottom、left、margin等等属性都能从字面意思理解，而Flex布局，确实是从没见过的东西，不理解里面的概念根本没法用。好在找到了阮一峰老师的[Flex 布局教程：语法篇](http://www.ruanyifeng.com/blog/2015/07/flex-grammar.html)的这篇文章，快速的掌握了Flex布局。
在这几天ReactNative的开发当中，越发觉得Flex布局的重要性，能将上面的属性全部理解清楚的话，并且灵活使用，必然会让ReactNative开发之旅更加得心应手。

##参考：
[Flex 布局教程：语法篇](http://www.ruanyifeng.com/blog/2015/07/flex-grammar.html)    
[弹性盒(Flexbox)](http://reactnative.cn/docs/flexbox.html#content)





