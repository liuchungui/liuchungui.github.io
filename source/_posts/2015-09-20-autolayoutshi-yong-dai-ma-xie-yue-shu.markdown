---
layout: post
title: "AutoLayout使用代码写约束"
date: 2015-09-20 23:20:56 +0800
comments: true
tags: [AutoLayout, 代码写约束]
keywords: AutoLayout, 代码写约束, Masnory, 约束添加动画
categories: iOS
---

###一、约束是什么？     
  约束是视图与视图之间一些属性关系。
<!-- more -->
  我们先来了解一下下面的内容：
    
  **视图属性**：视图属性(attribute)有`left`, `right`, `top`, `bottom`, `leading`, `trailing`, `width`, `height`, `centerX`, `centerY` 和 `baseline`。(注：iOS8加上了`Margin`，所以实际上从iOS8开始不止这些)
  
约束属性：每一个约束(Constraint)拥有的属性(Property)有：

   * **Constant value**: 偏移量
   * **Relation**: 属性之间的关系，和关系表达式对应，例如>(大于),=(等于),>=(大于等于)
   * **Priority level**: 优先级，优先级越高，越会满足此约束。
   
一个普通约束表达式: `view1.attribute = view2.attribute + ConstantValue` 
   
例子：当你定义一个button的位置时，你可能会有这么一个要求："按钮的左边距离父视图的左边20像素"。其实这句话用约束表达就是`button.left = (superView.left + 20)`。

###二、VFL(Visual Format Language)
#####1、语法

下面这是一些常用的VFL语法示例，如果想要知道更详细的语法规则，请查看[Auto Layout Guide](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/AutolayoutPG/VisualFormatLanguage.html)

<table style="text-align:center;" bgcolor="#FFFFFF"> 
   <tbody>
    <tr> 
     <td>语法示例</td> 
     <td>效果图片</td> 
     <td>解释</td> 
    </tr> 
   </tbody>
   <tbody> 
    <tr> 
     <td>[button]-[textField]</td> 
     <td><img src="http://ww4.sinaimg.cn/large/91c6e389jw1ew8up8p9omj205z00odfm.jpg" /></td> 
     <td>标准空间距离为8像素</td> 
    </tr> 
    <tr> 
     <td>[button(&gt;=50)]</td> 
     <td><img src="http://ww2.sinaimg.cn/large/91c6e389jw1ew8ur9pn6nj2020015q2q.jpg" /></td> 
     <td>宽度约束</td> 
    </tr> 
    <tr> 
     <td>|-50-[purpleBox]-50-|</td> 
     <td><img src="http://ww4.sinaimg.cn/large/91c6e389jw1ew8uro1kggj204800wq2r.jpg" /></td> 
     <td>设置与父视图的关系，'|'代表父视图</td> 
    </tr> 
    <tr> 
     <td>V:[topField]-10-[bottomField]</td> 
     <td><img src="http://ww1.sinaimg.cn/large/91c6e389jw1ew8us3r78nj202o01ia9t.jpg" /></td> 
     <td>垂直方向的布局，'V'代表垂直方向，'H'代表水平方向</td> 
    </tr> 
    <tr> 
     <td>[maroonView][blueView]</td> 
     <td><img src="http://ww1.sinaimg.cn/large/91c6e389jw1ew8usnshqsj202r00k0b9.jpg" /></td> 
     <td>Flush Views</td> 
    </tr> 
    <tr> 
     <td>[button(100@20)]</td> 
     <td><img src="http://ww1.sinaimg.cn/large/91c6e389jw1ew8usxcz1lj202u014t8i.jpg" /></td> 
     <td>设置优先级，@后面就是此约束的优先级</td> 
    </tr> 
    <tr> 
     <td>[button1(==button2)]</td> 
     <td><img src="http://ww3.sinaimg.cn/large/91c6e389jw1ew8ut6n9abj205e015jr9.jpg" /></td> 
     <td>等宽设置</td> 
    </tr> 
    <tr> 
     <td>[flexibleButton(&gt;=70,&lt;=100)]</td> 
     <td><img src="http://ww4.sinaimg.cn/large/91c6e389jw1ew8uteqiv8j202t01m744.jpg" /></td> 
     <td>多个谓语来确定尺寸</td> 
    </tr> 
   </tbody> 
</table> 
  
  
#####2、VFL使用

我们现在需要做这么一个UI需求：页面中有两个元素一张图片和一个文本。图片距左右两边和顶部10像素，而距底部100像素；文本距图片30像素。这个用代码如何实现？请看下面代码：

```objc
UIImageView *imageView = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"dog.jpg"]];
imageView.contentMode = UIViewContentModeScaleAspectFit;
//注意：代码约束需要设置视图的translatesAutoresizingMaskIntoConstraints属性为NO
imageView.translatesAutoresizingMaskIntoConstraints = NO;
[self.view addSubview:imageView];
self.imageView = imageView;

UILabel *label = [[UILabel alloc] initWithFrame:CGRectZero];
label.textColor = [UIColor darkGrayColor];
label.text = @"This is a lovely dog";
label.translatesAutoresizingMaskIntoConstraints = NO;
[self.view addSubview:label];

NSDictionary *viewsDictionary = NSDictionaryOfVariableBindings(imageView, label);

//设置图片的水平方向距父视图左右两边都为10
NSArray *constraintArr1 = [NSLayoutConstraint constraintsWithVisualFormat:@"H:|-10-[imageView]-10-|" options:0 metrics:nil views:viewsDictionary];
[self.view addConstraints:constraintArr1];

//设置图片垂直方向距父视图顶部10，底部100
NSArray *constraintArr2 = [NSLayoutConstraint constraintsWithVisualFormat:@"V:|-10-[imageView]-100-|" options:0 metrics:nil views:viewsDictionary];
[self.view addConstraints:constraintArr2];

//设置label的约束
NSArray *constraintArr3 = [NSLayoutConstraint constraintsWithVisualFormat:@"V:[imageView]-30-[label]" options:0 metrics:nil views:viewsDictionary];
[self.view addConstraints:constraintArr3];
```
            
如下是运行的效果图：

<img src="http://ww4.sinaimg.cn/large/91c6e389jw1ew8yjnu80jj20yi1pcwj4.jpg" width=310 height=552 />

   到这里，我们已经使用VFL实现了需求。
    
   假如有一天，我们的产品经理觉得这个效果不好看，需要改一改，然后UI设计师重新出了一套效果图。上面的页面已经修改成：图片距左右两边和顶部10像素，而图片宽与高比例为5:7；描述文本处于水平居中位置，并且处于图片的下方与屏幕上方居中位置。
   
   此时，我们用代码如何实现？
   
   查看VFL语法，明显图片宽与高比例为5:7这个需求没有直接对应的语法，实现起来有点复杂。这时，我们可以使用苹果为我们封装的另外一个创建约束的方法`constraintWithItem:attribute:relatedBy:toItem:attribute:multiplier:constant:`，就可以轻易实现我们的需求。如下，就是实现代码：

```objc

UIImageView *imageView = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"dog.jpg"]];
imageView.contentMode = UIViewContentModeScaleAspectFit;
//注意：代码约束需要设置视图的translatesAutoresizingMaskIntoConstraints属性为NO
imageView.translatesAutoresizingMaskIntoConstraints = NO;
[self.view addSubview:imageView];
self.imageView = imageView;

UILabel *label = [[UILabel alloc] initWithFrame:CGRectZero];
label.textColor = [UIColor darkGrayColor];
label.text = @"This is a lovely dog";
label.translatesAutoresizingMaskIntoConstraints = NO;
[self.view addSubview:label];

NSDictionary *viewsDictionary = NSDictionaryOfVariableBindings(imageView, label);

//设置图片的水平方向距父视图左右两边都为10像素
NSArray *constraintArr1 = [NSLayoutConstraint constraintsWithVisualFormat:@"H:|-10-[imageView]-10-|" options:0 metrics:nil views:viewsDictionary];
[self.view addConstraints:constraintArr1];

/*
//设置图片垂直方向距父视图顶部10像素，底部100像素
NSArray *constraintArr2 = [NSLayoutConstraint constraintsWithVisualFormat:@"V:|-10-[imageView]-100-|" options:0 metrics:nil views:viewsDictionary];
[self.view addConstraints:constraintArr2];

//设置label的约束
NSArray *constraintArr3 = [NSLayoutConstraint constraintsWithVisualFormat:@"V:[imageView]-30-[label]" options:0 metrics:nil views:viewsDictionary];
[self.view addConstraints:constraintArr3];
    */

//设置图片的宽与高的比例为5:7
NSLayoutConstraint *constraint1 = [NSLayoutConstraint constraintWithItem:imageView attribute:NSLayoutAttributeHeight relatedBy:NSLayoutRelationEqual toItem:imageView attribute:NSLayoutAttributeWidth multiplier:1.4 constant:0];
[self.view addConstraint:constraint1];

//设置图片距顶部10像素，描述文字处于图片与屏幕底部中间
NSArray *constraintArr3 = [NSLayoutConstraint constraintsWithVisualFormat:@"V:|-10-[imageView]-[label]-|" options:0 metrics:nil views:viewsDictionary];
[self.view addConstraints:constraintArr3];

//描述文本水平居中
NSLayoutConstraint *constraint2 = [NSLayoutConstraint constraintWithItem:label attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:self.view attribute:NSLayoutAttributeCenterX multiplier:1.0 constant:0];
[self.view addConstraint:constraint2];
```

运行效果如下：

<img src="http://ww4.sinaimg.cn/large/91c6e389jw1ew905ecso1j20yi1pc78y.jpg" width=310 height=552 />

`constraintWithItem:attribute:relatedBy:toItem:attribute:multiplier:constant:`方法主要是为了创建视图约束属性之间的关系，而这个方法的精髓主要是这么一个表达式：**view1.attribute = view2.attribute * multiplier + constant**。这里与我们前面讲过的表达式类似，只是多了一个multiplier的系数。


###三、Masnory写约束

[Masonry](https://github.com/SnapKit/Masonry)是一个轻量级的布局框架，拥有自己的描述语法，采用更优雅的链式语法封装自动布局，简洁明了 并具有高可读性。

上面的需求，我使用Masnory实现起来，代码简洁了很多，而且基本上不怎么需要学就能通过Masnory实现上面的需求，代码如下：

```objc
//注意：代码约束需要设置视图的translatesAutoresizingMaskIntoConstraints属性为NO
UIImageView *imageView = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"dog.jpg"]];
imageView.contentMode = UIViewContentModeScaleAspectFit;
imageView.translatesAutoresizingMaskIntoConstraints = NO;
[self.view addSubview:imageView];

UILabel *label = [[UILabel alloc] initWithFrame:CGRectZero];
label.textColor = [UIColor darkGrayColor];
label.text = @"This is a lovely dog";
label.translatesAutoresizingMaskIntoConstraints = NO;
[self.view addSubview:label];

//设置图片的水平方向距父视图左右两边都为10像素，图片的宽与高的比例为5:7
[imageView mas_makeConstraints:^(MASConstraintMaker *make) {
    make.left.equalTo(self.view.mas_left).with.offset(10);
    make.right.equalTo(self.view.mas_right).with.offset(-10);
    make.top.equalTo(self.view.mas_top).with.offset(10);
    make.height.equalTo(imageView.mas_width).with.multipliedBy(1.4);
}];

//文字描述水平居中，并且处于图片与屏幕底部中间
[label mas_makeConstraints:^(MASConstraintMaker *make) {
    make.centerX.equalTo(self.view.mas_centerX);
    make.top.equalTo(imageView.mas_bottom);
    make.bottom.equalTo(self.view.mas_bottom);
}];
```

    
  效果如下：
  
  <img src="http://ww4.sinaimg.cn/large/91c6e389jw1ew905ecso1j20yi1pc78y.jpg" width=310 height=552 />
  
  示例代码已经放到github上了，[github代码示例](https://github.com/liuchungui/VFLDemo.git)
  
  
###四、使用AutoLayout时，如何添加动画？
 
 使用VFL时，动画改变尺寸或位置时，很简单只需要将对应的约束保存成全局变量，然后改变约束当中的属性就行了。

 使用Autolayout动画改变尺寸、位置的官方模板如下：

```objc
[containerView layoutIfNeeded]; // Ensures that all pending layout operations have been completed[UIView animateWithDuration:1.0 animations:^{    // Make all constraint changes here[containerView layoutIfNeeded]; // Forces the layout of the subtree animation block and then captures all of the frame changes}];
```

那如果使用的是Masnory框架，怎么添加动画？

我这里有个Demo，请看代码：


    - (void)viewDidLoad {
        [super viewDidLoad];
        
        //创建displayView
        UIView *displayView = [[UIView alloc] init];
        displayView.backgroundColor = [UIColor purpleColor];
        [self.view addSubview:displayView];
        self.displayView = displayView;
        
        UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
        [button setTitle:@"点击" forState:UIControlStateNormal];
        [button setTitleColor:[UIColor darkGrayColor] forState:UIControlStateHighlighted];
        [button setTitleColor:[UIColor blueColor] forState:UIControlStateNormal];
        [button addTarget:self action:@selector(buttonAction:) forControlEvents:UIControlEventTouchUpInside];
        [self.view addSubview:button];
        
        //添加约束
        [displayView mas_makeConstraints:^(MASConstraintMaker *make) {
            make.top.equalTo(self.view.mas_top).offset(100);
            make.size.mas_equalTo(CGSizeMake(50, 50));
            make.centerX.equalTo(self.view.mas_centerX);
        }];
        
        [button mas_makeConstraints:^(MASConstraintMaker *make) {
            make.centerX.equalTo(self.view.mas_centerX);
            make.size.mas_equalTo(CGSizeMake(200, 50));
            make.bottom.mas_equalTo(self.view.mas_bottom).offset(-50);
        }];
        // Do any additional setup after loading the view, typically from a nib.
    } 
    
           
    - (void)buttonAction:(UIButton *)butt    on{
        //动    画改变
        [self.view layoutIfNeeded];
        [UIView animateWithDuration:1.0 animations:^{
            [self.displayView mas_updateConstraints:^(MASConstraintMaker *make) {
                make.size.mas_equalTo(CGSizeMake(300, 300));
                }];
            [self.view layoutIfNeeded];
        }];
    }
   

示例代码已经放到github上了，[github代码示例](https://github.com/liuchungui/AnimationForAutoLayoutDemo.git)
 
###五、什么时候使用代码写约束？
  
  使用Xib写约束，可以很直观、快捷的搭建界面，让我们的开发速度提升很快。但，Xib开发有时候不是很灵活，这个时候我们就得考虑使用代码来实现约束。
   
  以下几种情况，我觉得使用代码写约束比较适合：
  
  * 运行时改变视图尺寸、位置的时候，应该使用代码写约束   
  * 封装一个控件时，使其能够有足够的灵活性，应该使用代码写约束   
  * 添加动画的时候，使用代码写约束。   
  * 一些复杂的UI，使用IB很难实现的场景，使用代码写约束
  
###六、总结

这篇文章主要讲了下面一些东西

* 约束是什么
* VFL相关语法
* VFL的使用
* Masnory框架的使用
* 使用Autolayout时，添加动画
* 哪些场景下使用代码来写约束
