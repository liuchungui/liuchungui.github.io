---
layout: post
title: "UICollectionView动画"
date: 2015-11-24 00:00:26 +0800
comments: true
tags: [UICollectionView, UICollectionViewLayout, CustomLayout，CollectionView, CollectionView动画, 动画]
keywords: UICollectionView, UICollectionViewLayout, CustomLayout，CollectionView, CollectionView动画, 动画
categories: iOS
---
##一、简单使用
UICollectionView更新事件有四种分别是`插入`、`删除`、`刷新`、`移动`，
api使用起来和UITableView类似，具体可以自己在代码中找，如果需要执行多个更新事件，可以放到performBatchUpdates中的updates闭包中作为一组动画，然后全部执行完之后通过completion调回。

```swift
    collectionView.performBatchUpdates({ () -> Void in
                collectionView.insertItemsAtIndexPaths(insertIndexPaths)
                collectionView.moveItemAtIndexPath(currentIndexPath, toIndexPath: toIndexPath)
                }, completion: { (isFinish) -> Void in
            })
```


##二、UICollectionView动画
四种不同的更新事件，系统默认会带有动画，不过是比较简单的。我们可以自定义layout或者继承flowLayout，在内部实现我们自己想要的动画。下面，我们来说说动画的流程，以及系统默认的四种动画内部是如何的，并且通过代码来修改达到自己想要的动画。
<!-- more -->

####CollectionView动画流程
当我们在外部调用CollectionView相关的api去`插入`、`删除`、`刷新`、`移动`cell时，首先会通过layout中的`layoutAttributesForElementsInRect`方法获取更新以后的布局信息，然后通过`prepareForCollectionViewUpdates`方法来通知layout哪些内容将会发生改变。之后，通过调用layout中的`initialLayoutAttributesForAppearingItemAtIndexPath`、`finalLayoutAttributesForDisappearingItemAtIndexPath`方法获取对应indexPath的`刚出现时最初布局属性`和`消失时最终布局属性`。而后形成两个动画过程分别是`刚出现时最初布局->更新后布局的出现动画`和`更新前布局->消失时最终布局的消失动画`，而collectionView中'插入'、'删除'、'刷新'和'移动'动画都是基于这两个动画组合形成的。最后，等这一系列动画执行完之后，最后会调用layout中`finalizeCollectionViewUpdates`方法，这个方法仍然放在动画块中，我们可以在这个方法当中添加额外的动画。

从上面流程可以看出，在更新的时候，由于`更新前布局`和`更新后布局`都是在更新动画前已经设置好了，我们不能去胡乱更改布局，所以我们只能通过`initialLayoutAttributesForAppearingItemAtIndexPath`和`finalLayoutAttributesForDisappearingItemAtIndexPath`两个方法来更改`刚出现时最初布局属性`和`消失时最终布局属性`，即我们只能更改`出现动画的起点`和`消失动画的终点`。

为了更方面的下面说明，引申出两个名词：

* 出现动画：initialLayoutAttributesForAppearingItemAtIndexPath获取对应indexPath的`刚出现时最初布局`->更新后布局变化过程
* 消失动画：更新之前的布局->finalLayoutAttributesForDisappearingItemAtIndexPath方法获取对应indexPath的`消失时最终布局`的变化过程

注意，出现动画和消失动画针对的是一个cell单元。

下面我们通过代码示例来实现插入、删除、刷新、移动动画。
代码示例工程：[UICollectionViewAnimationDemo](https://github.com/liuchungui/UICollectionViewAnimationDemo)

在这个Demo工程中有一个`BGSelectImageLayout`，它是CollectionView的layout，它的布局方式是水平横向滑动，并且只有一组，每一个普通的cell大小都是`itemSize`，而选中的cell则宽度是`itemSize*2`。

####插入动画：
在当前的布局下，每插入一个cell时，都会影响它后面所有cell布局变化。        
例如CollectionView有一行三个cell，为了更好的说明将indexPath是(0,0),(0,1),(0,2)标记为0，1，2。当在第1个位置插入一个cell时，如下图

![](http://ww2.sinaimg.cn/large/7746cd07jw1eyba1ih4nvj20re0fs75l.jpg)

而在这个插入过程中，视觉上会有三个动画过程。new插入到位置1为`过程1`，1移动一个单位到2为`过程2`，2移动一个单位到一个新的位置3为`过程3`，如下图：

![](http://ww3.sinaimg.cn/large/7746cd07jw1eyba58t45gj20yc0g6760.jpg)

虽然视觉上只有三个动画过程，但其实有五个动画。其中，过程1是1位置的`出现动画`；过程2是1位置的`消失动画`和2位置的`出现动画`重合而成；过程3是2位置的`消失动画`和3位置的`出现动画`。
       
其中值得注意的三点，一是除了最后一个，前面的cell消失动画与它后面cell出现动画重合，这样看起来就是当前位置的cell向后平移了一个位置；二是最后一个cell只有出现动画，没有消失动画，整个过程`出现动画会多一个`；三是插入的cell的出现动画是默认是alpha从0到1的淡入效果。

在代码中，想获得一个插入的cell从小变大的出现效果和其它cell整体向后移动一个位置的动画效果，可以如下实现：

```
    override func initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath: NSIndexPath) -> UICollectionViewLayoutAttributes? {
        let attributes = super.initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath)?.copy() as? UICollectionViewLayoutAttributes
        if self.insertIndexPathArr.contains(itemIndexPath) {
            attributes?.transform = CGAffineTransformMakeScale(0.0, 0.0)
            attributes?.alpha = 0
        }
        else {
            //设置为前一个item的frame
            attributes?.frame = self.currentFrameWithIndexPath(NSIndexPath(forRow: itemIndexPath.row-1, inSection: itemIndexPath.section))
        }
        return attributes
}
override func finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath: NSIndexPath) -> UICollectionViewLayoutAttributes? {
    	 let attributes = super.finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath)?.copy() as? UICollectionViewLayoutAttributes
         attributes?.frame = self.currentFrameWithIndexPath(NSIndexPath(forRow: itemIndexPath.row+1, inSection: itemIndexPath.section))
         return attributes
}
```

这里为了看到效果，我在模拟器的Debug模式下勾选了Slow Animations调慢了动画:
![](http://ww3.sinaimg.cn/large/7746cd07jw1eyaa2ommv4g208j0frab5.gif)

####删除动画：
在上面的位置1插入一个cell后，cell的数量变成了4个，分别是0、1、2、3，它们对应的indexPath为(0,0)、(0,1)、(0,2)、(0,3)。当要删除位置1的cell时，与插入类似，系统默认也会有三个动画过程，如下图：

![](http://ww3.sinaimg.cn/large/7746cd07jw1eybbqnkm4cj20xo0dita5.jpg)

其中，动画过程1是在位置1执行一个消失动画；过程2是位置1的出现动画和位置2的消失动画重合而成；过程3是位置2的出现动画和位置3的消失动画重合而成。     
     
**需要注意的是**，一是与插入不同，重合后的效果是cell向前平移了一个位置；二是最后一个位置只有消失动画没有出现动画，整个过程消失动画数会多一个；三是删除的cell的出现动画默认是从1到0的淡出效果。

在代码中，实现一个与插入相对应的动画，即删除的cell从大到小的淡出效果和其它cell整体向前移动一个位置的效果，可以如下实现：

```
override func initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath: NSIndexPath) -> UICollectionViewLayoutAttributes? {
    let attributes = super.initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath)?.copy() as? UICollectionViewLayoutAttributes
    attributes?.frame = self.currentFrameWithIndexPath(NSIndexPath(forRow: itemIndexPath.row+1, inSection: itemIndexPath.section))
    return attributes
}
override func finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath: NSIndexPath) -> UICollectionViewLayoutAttributes? {
        let attributes = super.finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath)?.copy() as? UICollectionViewLayoutAttributes
    if self.deleteIndexPathArr.contains(itemIndexPath) {
        //这里写成缩放成(0，0)直接就不见了
        attributes?.transform = CGAffineTransformMakeScale(0.1, 0.1)
        attributes?.alpha = 0.0
    }
    else {
        attributes?.frame = self.currentFrameWithIndexPath(NSIndexPath(forRow: itemIndexPath.row-1, inSection: itemIndexPath.section))
    }
    return attributes
}
```

效果如下：

![](http://ww2.sinaimg.cn/large/7746cd07jw1eyaqorep4rg208j0g9wgw.gif)

####刷新动画：
在官方的解释中，刷新是先删除然后插入。其实它就是先执行所有cell的消失动画；在此之后，它又会执行所有cell的出现动画。
在系统当中，需要注意的是默认出现动画是一个alpha从0到1的淡入效果，而消失动画则是alpha从1到0的淡入效果；与插入动画和删除动画不同的是，刷新动画会成对存在，即消失动画与出现动画数量相等。

在这里，实现一个点击某个cell时，当前选中的cell变大的效果，而它旁边的cell被推开的动画效果。在这里我不需要淡入和淡出效果，所以修改了消失时alpha为1.0，代码如下：

```
override func initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath: NSIndexPath) -> UICollectionViewLayoutAttributes? {
    let attributes = super.initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath)?.copy() as? UICollectionViewLayoutAttributes
    attributes?.frame = self.lastFrameWithIndexPath(itemIndexPath)
    return attributes
}
override func finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath: NSIndexPath) -> UICollectionViewLayoutAttributes? {
    let attributes = super.finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath)?.copy() as? UICollectionViewLayoutAttributes
    //注意，这里alpha设置为不透明，系统默认返回是0，即一个淡出的效果
    attributes?.alpha = 1.0
    attributes?.frame = self.currentFrameWithIndexPath(itemIndexPath)
    return attributes
}
```
效果如下：

![](http://ww2.sinaimg.cn/large/7746cd07jw1eyb04xye32g208j0g9755.gif)

####移动动画：
移动一个cell到另一个位置时，会引起当前cell到目标位置之间所有cell布局发生变化，从而形成一系列的动画。在这个动画过程中，每个indexPath都会有一个出现动画和一个消失动画。

例如，在系统默认情况下，0位置cell移动到2位置cell的时候，我们会看到三个动画过程，如下图：

![](http://ww1.sinaimg.cn/large/7746cd07jw1eyazemzgkzj20qa0bqt9u.jpg)

但是，其实它内部执行了六个动画，只是其中两两之间动画重合了而已。其中动画过程1是1位置的消失动画和0位置出现动画重合；动画过程2是0位置的消失动画和2位置的出现动画重合；动画过程3是2位置的消失动画和1位置的出现动画重合。

**其中值得注意的有两点：**     
1、消失动画和出现动画数量相等      
2、动画的重合与刷新动画不同，与插入和删除动画类似，它们不同位置之间的消失动画与出现动画重合。

在这里，实现一个移动cell时旋转180°到目标位置效果，实现如下：

```
 override func initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath: NSIndexPath) -> UICollectionViewLayoutAttributes? {
    let attributes = super.initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath)?.copy() as? UICollectionViewLayoutAttributes
    if itemIndexPath == self.afterMoveIndexPath {
        //afterMoveIndexPath的消失动画和beforeMoveIndexPath的出现动画重合
        //init是设置起点，而final设置终点，理论是不重合的
        attributes?.transform3D = CATransform3DMakeRotation(-1*CGFloat(M_PI), 0, 0, -1)
    }
    return attributes
}
override func finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath: NSIndexPath) -> UICollectionViewLayoutAttributes? {
    let attributes = super.finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath)?.copy() as? UICollectionViewLayoutAttributes
    if self.beforeMoveIndexPath == itemIndexPath {
        //afterMoveIndexPath的消失动画和beforeMoveIndexPath的出现动画重合，设置他们旋转的角度一样，方向相反
        attributes?.transform3D = CATransform3DMakeRotation(-1*CGFloat(M_PI), 0, 0, -1)
    }
    return attributes
}
```
效果如下：

![](http://ww1.sinaimg.cn/large/7746cd07jw1eyb0375fz7g208j0g9go4.gif)

上面都是纯颜色，在示例工程[UICollectionViewAnimationDemo](https://github.com/liuchungui/UICollectionViewAnimationDemo)中，我还添加了一个图片的`BGSimpleImageSelectCollectionViewDemo2`。布局基本上相同，唯一不同的是图片因为上下不可以倒转，没办法做到统一的旋转180°。

效果如下：

![](http://ww3.sinaimg.cn/large/7746cd07jw1eybewu3qyxg208j0g9k2r.gif)

##总结：
1、CollectionView更新时，执行动画的时候会访问layout中哪些api，整个流程是如何形成的          
2、修改CollectionView动画就是修改出现动画的起点和消失动画的终点，即layout当中的initialLayoutAttributesForAppearingItemAtIndexPath和finalLayoutAttributesForDisappearingItemAtIndexPath方法进行修改。       
3、插入、删除、刷新、移动内部执行哪些动画，我们如何去修改。    

##参考：
[Collection View 动画](http://objccn.io/issue-12-5/)   
