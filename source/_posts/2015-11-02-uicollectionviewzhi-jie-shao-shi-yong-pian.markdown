---
layout: post
title: "UICollectionView之介绍使用篇"
date: 2015-11-02 00:29:12 +0800
comments: true
tags: [UICollectionView, UICollectionViewLayout]
keywords: UICollectionView, UICollectionViewLayout
categories: iOS
---
实现垂直方向的单列表来说，使用UITableView足以；若是需要构建横向滑动列表、gridView等直线型布局，则使用UICollectionView+UICollectionViewFlowLayout搭建最合适；更复杂的布局，则可以使用UICollectionView+自定义Layout来实现。

而这篇博客就来介绍一下UICollectionView。

首先，来了解一下UICollectionView工作流程：

![](http://ww3.sinaimg.cn/large/7746cd07jw1exjnjqrju5j20x00qk76h.jpg)

当UICollectionView显示内容时，先从数据源获取cell，然后交给UICollectionView。再从UICollectionViewLayout获取对应的layout attributes(布局属性)。最后，根据每个cell对应的layout attributes(布局属性)来对cell进行布局，生成了最终的界面。而用户交互的时候，都是通过Delegate来进行交互。当然，上面只是布局cell，但是UICollectionView内部还有Supplementary View和Decoration View，也可以对其进行布局。

上面，我们了解了UICollectionView的工作流程，我们将UICollectionView分成视图、数据源和代理方法、UICollectionViewLayout三块来介绍。
<!-- more -->

##一、视图
UICollectionView上面显示内容的视图有三种Cell视图、Supplementary View和Decoration View。
####Cell视图
CollectionView中主要的内容都是由它展示的，它是从数据源对象获取的。
####Supplementary View
它展示了每一组当中的信息，与cell类似，它是从数据源方法当中获取的，但是与cell不同的是，它并不是强制需要的。例如flow layout当中的headers和footers就是可选的Supplementary View。
####Decoration View
这个视图是一个装饰视图，它没有什么功能性，它不跟数据源有任何关系，它完全属于layout对象。

##二、数据源和代理方法
####1、注册cell或者Supplementary View使其重用
在使用数据源返回cell或者Supplementary View给collectionView之前，我们必须先要注册，用来进行重用。     

* registerClass: forCellWithReuseIdentifier:
* registerNib: forCellWithReuseIdentifier:
* registerClass: forSupplementaryViewOfKind: withReuseIdentifier:
* registerNib: forSupplementaryViewOfKind: withReuseIdentifier:

 显而易见，前面两个方法是注册cell，后两个方法注册Supplementary View。其中，注册的方式有两种，第一种是直接注册class，它重用的时候会调用[[UICollectionView alloc] init]这样的初始化方法创建cell；另外一种是注册nib，它会自动加载nib文件。
 
 注册的之后，我们如何重用？         
 在数据源方法当中返回`cell`或者`Supplementary view`的方法当中通过`dequeueReusableCellWithReuseIdentifier:forIndexPath:` 或者 `dequeueReusableSupplementaryViewOfKind:withReuseIdentifier:forIndexPath:`方法获取cell或者Supplementary View。 
 
示例代码：
```objc
- (UICollectionViewCell *)collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath{
    CollectionViewCell *cell = (CollectionViewCell *)[collectionView dequeueReusableCellWithReuseIdentifier:CellReuseIdentify forIndexPath:indexPath];
    cell.backgroundColor = [UIColor lightGrayColor];
    cell.textLabel.text = [NSString stringWithFormat:@"(%zd,%zd)", indexPath.section, indexPath.row];
    return cell;
}
```
 
####2、数据源方法
 数据源方法与UITableView类似，主要有：
 
 - numberOfSectionsInCollectionView:
 - collectionView: numberOfItemsInSection:
- collectionView: cellForItemAtIndexPath:
- collectionView: viewForSupplementaryElementOfKind: atIndexPath:
 
与UITableView不同的是多加了返回Supplementary view数据源方法。

####3、代理方法
数据源为UICollectionView提供数据相关的内容，而代理则主要负责用户交互、与数据无关的视图外形。主要分成两部分：

1、通过调用代理方法，管理视图的选中、高亮

* collectionView:shouldDeselectItemAtIndexPath:
* collectionView:didSelectItemAtIndexPath:
* collectionView:didDeselectItemAtIndexPath:
* collectionView:shouldHighlightItemAtIndexPath:
* collectionView:didHighlightItemAtIndexPath:
* collectionView:didUnhighlightItemAtIndexPath:

 2、长按cell，显示编辑菜单
 与UITableView不同，用户长按cell时，UICollectionView可以显示编辑菜单。这个编辑菜单可以用来剪切、复制和粘贴cell。不过，要显示这个编辑菜单需要满足下面几个条件：
 
 * 代理对象必须实现下面三个方法：       
   `collectionView:shouldShowMenuForItemAtIndexPath:`   `collectionView:canPerformAction:forItemAtIndexPath:withSender:`   `collectionView:performAction:forItemAtIndexPath:withSender:`
* 对于指定要编辑的cell，`collectionView:shouldShowMenuForItemAtIndexPath:`方法需要返回`YES`
* `collectionView:canPerformAction:forItemAtIndexPath:withSender:` 方法中，对于剪切、复制、粘贴三种action至少有一个返回YES。其实，编辑菜单是有很多种action的，但是对于UICollectionView来说，它仅仅支持的剪切、复制、粘贴三个，所以说这个代理方法至少支持这三种的一种。    
  剪切、复制、粘贴的方法名是：     
  `cut:`     
  `copy:`     
  `paste:`    
  
  当上面的条件都满足了，用户就可以长按cell显示出编辑菜单，然后选择对应的action，从而就会回调delegate的collectionView:performAction:forItemAtIndexPath:withSender: 方法去做对应的事情。
  
当我们想控制编辑菜单仅仅显示复制和粘贴时，我们就可以在`collectionView:canPerformAction:forItemAtIndexPath:withSender:`方法中进行操作，具体请见下面代码：

```objc
- (BOOL)collectionView:(UICollectionView *)collectionView canPerformAction:(SEL)action forItemAtIndexPath:(NSIndexPath *)indexPath withSender:(id)sender{
    if ([NSStringFromSelector(action) isEqualToString:@"copy:"]        || [NSStringFromSelector(action) isEqualToString:@"paste:"])        return YES;    return NO;
}
```

##三、UICollectionViewLayout
`UICollectionViewLayout`是通过`UICollectionViewLayoutAttributes`类来管理`cell`、`Supplementary View`和`Decoration View`的`位置`、`transform`、`alpha`、`hidden`等等。     
UICollectionViewLayout这个类只是一个基类，我们给UICollectionView使用的都是它的`子类`。系统为我们提供了一个最常用的layout为`UICollectionViewFlowLayout`，我们可以使用它制作`grid view`。当UICollectionViewLayout满足不了我们的需求时，我们可以`子类化UICollectionViewLayout`或者`自定义layout`，这个内容放到我下一篇当中。

####UICollectionViewFlowLayout
使用UICollectionViewFlowLayout之前，我们来了解它内部常用的属性：

```
//同一组当中，垂直方向：行与行之间的间距；水平方向：列与列之间的间距
@property (nonatomic) CGFloat minimumLineSpacing; 
//垂直方向：同一行中的cell之间的间距；水平方向：同一列中，cell与cell之间的间距
@property (nonatomic) CGFloat minimumInteritemSpacing;
//每个cell统一尺寸
@property (nonatomic) CGSize itemSize;
//滑动反向，默认滑动方向是垂直方向滑动
@property (nonatomic) UICollectionViewScrollDirection scrollDirection; 
//每一组头视图的尺寸。如果是垂直方向滑动，则只有高起作用；如果是水平方向滑动，则只有宽起作用。
@property (nonatomic) CGSize headerReferenceSize;
//每一组尾部视图的尺寸。如果是垂直方向滑动，则只有高起作用；如果是水平方向滑动，则只有宽起作用。
@property (nonatomic) CGSize footerReferenceSize;
//每一组的内容缩进
@property (nonatomic) UIEdgeInsets sectionInset;
```
注意：UICollectionViewFlowLayout内部的属性都是用来统一设置，若是统一设置无法满足需求，可以实现`UICollectionViewDelegateFlowLayout`代理方法，进行对应的设置。而后面内容我都以UICollectionViewFlowLayout的属性来叙述，请自行参照修改。

UICollectionViewFlowLayout在纵向滑动与横向滑动时，布局是不太一样的。
<p align="center" >
  <img src="http://ww1.sinaimg.cn/large/7746cd07jw1exmpk8hs66j20ea0fcabe.jpg" width=257 height = 274>
  <img src="http://ww3.sinaimg.cn/large/7746cd07jw1exmq7ebjo2j20es0cujsp.jpg" width=266 height = 231>
</p>

由上图就可以看出来，UICollectionViewFlowLayout在布局时，会根据scrollDirection的值不同而产生不同的布局。

* 垂直方向滑动：
    * Cell布局：UICollectionView的内容宽度与本身视图的宽度相等，并且是固定的。会根据`sectionInset左右缩进`、`itemSize的宽度`、`minimumInteritemSpacing`三个值来计算每一行cell数量。     
具体计算公式是:     
`  
cellCount = (CollectionViewContentWidth-sectionInset.left-sectionInset.right+minimumInteritemSpacing)/(itemSize.width+minimumInteritemSpacing)      
`
`CollectionViewContentWidth`是UICollectionView的内容宽度，计算出来的`cellCount`进行四舍五入成一个整数就是`每一行cell的数量`。    
而每个cell之间实际的间隔值则是:    
`realInteritemSpacing = (CollectionViewContentWidth-sectionInset.left-sectionInset.right-cellCount*itemSize.width)/(cellCount-1)`    
当每个cell大小确定、每一行cell的个数确定、每个cell之间的间距确定之后，UICollectionViewFlowLayout就可以计算出每一行cell的frame了。    
而如果同一组cell的个数，在水平方向的一行放不下去，则就会放入第二行，而这第二行的cell在垂直方向与第一行的cell相隔`minimumLineSpacing`。这样又确定了行与行之间的间距，那么这一组cell的布局就可以确定了。             
    * 头视图与尾部视图：根据headerReferenceSize和footerReferenceSize中的高来确定头部和尾部视图的高，它其实就是两个不同类型的Supplementary View。
    
* 水平方向滑动：
    * Cell布局：水平方向的滑动内容的高与本身视图的高是相等的，并且是固定的。它的cell是从`上到下进行布局`的。会根据`sectionInset上下缩进`、`itemSize的高度`、`minimumInteritemSpacing`三个值来计算每一列放多少个cell，具体计算公式可以参照垂直方向滑动的公式。之后的逻辑和垂直方向滑动时一样，只是minimumLineSpacing现在是代表列与列之间的间距。     
    * 头视图与尾部视图：根据headerReferenceSize和footerReferenceSize中的宽来确定头部和尾部视图的宽。



相关使用UICollectionViewFlowLayout代码:[UICollectionViewDemo](https://github.com/liuchungui/UICollectionViewDemo)

##参考
[Collection View Programming Guide for iOS](https://developer.apple.com/library/prerelease/ios/documentation/WindowsViews/Conceptual/CollectionViewPGforIOS/Introduction/Introduction.html)     
[WWDC 2012 Session笔记——205 Introducing Collection Views](http://www.onevcat.com/2012/06/introducing-collection-views/)