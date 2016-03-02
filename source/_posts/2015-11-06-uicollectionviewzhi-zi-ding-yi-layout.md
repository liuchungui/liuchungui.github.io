---
layout: post
title: "UICollectionView之自定义Layout"
date: 2015-11-06 00:00:26 +0800
comments: true
tags: [UICollectionView, UICollectionViewLayout, CustomLayout，CollectionView, CollectionView自定义Layout, UICollectionView自定义Layout]
keywords: UICollectionView, UICollectionViewLayout, CustomLayout，CollectionView, CollectionView自定义Layout, UICollectionView自定义Layout
categories: iOS
---

当我们使用系统自带的UICollectionViewFlowLayout无法实现我们的布局时，我们就可以考虑自定义layout。       
所以，了解并学习一下自定义Layout是很有必要。      
其实可以分三个步骤：

1. 覆写prepareLayout方法，并在里面事先就计算好必要的布局信息并存储起来。
2. 基于prepareLayout方法中的布局信息，使用collectionViewContentSize方法返回UICollectionView的内容尺寸。
3. 使用layoutAttributesForElementsInRect:方法返回指定区域cell、Supplementary View和Decoration View的布局属性。
<!-- more -->

了解了自定义布局的三个主要步骤，我们来通过自定义布局的方式用UICollectionView实现grideView。当然，grideView使用`UICollectionViewFlowLayout`就可以轻易实现，这里我们只是学习了解一下自定义布局的过程，所以拿grideView这个经常用的来作为例子。

我们创建一个新的工程[BGCustomLayoutCollectionViewDemo](https://github.com/liuchungui/BGCustomLayoutCollectionViewDemo)。然后创建一个UICollectionViewLayout的子类对象`BGGrideLayout`，它就是我们自定义layout对象。
###在BGGrideLayout里面，我们首先覆写prepareLayout方法。       
prepareLayout是专门用来准备布局的，在`prepareLayout`方法里面我们可以事先就计算后面要用到的布局信息并存储起来，防止后面方法多次计算，提高性能。例如，我们可以在此方法就计算好每个cell的属性、整个CollectionView的内容尺寸等等。此方法在布局之前会调用一次，之后只有在调用`invalidateLayout`、`shouldInvalidateLayoutForBoundsChange:`返回`YES`和`UICollectionView刷新`的时候才会调用。

而在BGGrideLayout的prepareLayout方法中，我们有两个目的：      
一是获取对应indexPath的`UICollectionViewLayoutAttributes`对象，并存储到二维数组`layoutInfoArr`当中；     
二是计算出内容尺寸并保存到全局变量`contentSize`当中。       
代码如下：

```objc
- (void)prepareLayout{
    [super prepareLayout];
    NSMutableArray *layoutInfoArr = [NSMutableArray array];
    NSInteger maxNumberOfItems = 0;
    //获取布局信息
    NSInteger numberOfSections = [self.collectionView numberOfSections];
    for (NSInteger section = 0; section < numberOfSections; section++){
        NSInteger numberOfItems = [self.collectionView numberOfItemsInSection:section];
        NSMutableArray *subArr = [NSMutableArray arrayWithCapacity:numberOfItems];
        for (NSInteger item = 0; item < numberOfItems; item++){
            NSIndexPath *indexPath = [NSIndexPath indexPathForItem:item inSection:section];
            UICollectionViewLayoutAttributes *attributes = [self layoutAttributesForItemAtIndexPath:indexPath];
            [subArr addObject:attributes];
        }
        if(maxNumberOfItems < numberOfItems){
            maxNumberOfItems = numberOfItems;
        }
        //添加到二维数组
        [layoutInfoArr addObject:[subArr copy]];
    }
    //存储布局信息
    self.layoutInfoArr = [layoutInfoArr copy];
    //保存内容尺寸
    self.contentSize = CGSizeMake(maxNumberOfItems*(self.itemSize.width+self.interitemSpacing)+self.interitemSpacing, numberOfSections*(self.itemSize.height+self.lineSpacing)+self.lineSpacing);
}
```
在上面的代码中，我们看到了`UICollectionViewLayoutAttributes`这个类，这个类其实专门用来存储视图的内容，例如frame、size、apha、hiden等等，layout最后会拿着这些frame设置给对应的视图。
而上面代码中，获取`UICollectionViewLayoutAttributes`是通过`layoutAttributesForItemAtIndexPath:`方法

```
- (UICollectionViewLayoutAttributes *)layoutAttributesForItemAtIndexPath:(NSIndexPath *)indexPath{
    UICollectionViewLayoutAttributes *attributes = [UICollectionViewLayoutAttributes layoutAttributesForCellWithIndexPath:indexPath];
    //每一组cell为一行
    attributes.frame = CGRectMake((self.itemSize.width+self.interitemSpacing)*indexPath.row+self.interitemSpacing, (self.itemSize.height+self.lineSpacing)*indexPath.section+self.lineSpacing, self.itemSize.width, self.itemSize.height);
    return attributes;
}
```
在这个方法中，`itemSize`是cell的大小，`interitemSpacing`是cell与cell之间的间距，`lineSpacing`是行距。

###随后，覆写collectionViewContentSize
collectionViewContentSize返回内容尺寸给UICollectionView。注意这个方法返回的尺寸是给UICollectionView这个继承于`UIScrollView`的视图作为`contentSize`，不是UICollectionView的视图尺寸。正是因为这一点，我们自定义layout如果想让它只能横向滑动，只需要将这个`size.height`设置成`collectionView.height`就行了。
这个方法会多次调用，所以最好是在prepareLayout里就计算好。
在BGGrideLayout类中，我们只需要返回前面计算好的内容尺寸就行了。

```
- (CGSize)collectionViewContentSize{
    return self.contentSize;
}
```

###最后，覆写layoutAttributesForElementsInRect:方法
此方法需要返回一组UICollectionViewLayoutAttributes类型对象。它代表着在这个指定的区域中，我们需要显示`cell`、`Supplementary View`和`Decoration View`中哪些视图，而这些视图的属性则保存UICollectionViewLayoutAttributes中。
此方法会多次调用，为了更好的性能，在这个方法当中，我们使用的UICollectionViewLayoutAttributes最好是在prepareLayout已经布局好的信息。

在BGGrideLayout中，我们遍历二维数组，找出了与指定区域有交接的UICollectionViewLayoutAttributes对象放到一个数组中，然后返回。

```
- (NSArray *)layoutAttributesForElementsInRect:(CGRect)rect{
    NSMutableArray *layoutAttributesArr = [NSMutableArray array];
    [self.layoutInfoArr enumerateObjectsUsingBlock:^(NSArray *array, NSUInteger i, BOOL * _Nonnull stop) {
        [array enumerateObjectsUsingBlock:^(UICollectionViewLayoutAttributes *obj, NSUInteger idx, BOOL * _Nonnull stop) {
            if(CGRectIntersectsRect(obj.frame, rect)) {
                [layoutAttributesArr addObject:obj];
            }
        }];
    }];
    return layoutAttributesArr;
}
```

到这里，我们的BGGrideLayout已经写好了，使用部分的代码，请直接查看[BGCustomLayoutCollectionViewDemo](https://github.com/liuchungui/BGCustomLayoutCollectionViewDemo)中ViewController里面的代码就行了。

效果：

![Demo](http://ww4.sinaimg.cn/large/7746cd07jw1exqk0a7ofyg208j0fr7wh.gif)

##参考
[Collection View Programming Guide for iOS](https://developer.apple.com/library/prerelease/ios/documentation/WindowsViews/Conceptual/CollectionViewPGforIOS/Introduction/Introduction.html) 