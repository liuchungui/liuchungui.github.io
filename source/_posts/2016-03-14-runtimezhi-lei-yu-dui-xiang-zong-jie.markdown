---
layout: post
title: "Runtime之类与对象总结"
date: 2016-03-14 23:30:27 +0800
comments: true
keywords: Runtime, Runtime总结, Runtime调用代码
tags: Runtime, Runtime总结, Runtime调用代码
categories: ios
---

以前在使用[jastor](https://github.com/elado/jastor)解析Json成model的时候里面涉及到了Runtime里面的知识，所以专门看了[Objective-C Runtime 运行时之一到六](http://blog.jobbole.com/79566/)这一系列的文章，整个Jastor也就懂了，现在非常出名的框架[Mantle](https://github.com/Mantle/Mantle)，[JSONModel](https://github.com/icanzilb/JSONModel)也都是差不多的原理。但是，一年之后的今天重新再看的时候，发现大概思路知道，但是具体的一些细节实现需要写的时候，却一时上不了手，所以重新看了[Objective-C Runtime 运行时](http://blog.jobbole.com/79566/)一系列，然后整理了一下，细节部分附上一些代码，方便以后查找。
<!-- more -->

##一、对象、类、元类之间的关系
* 每个对象是一个objc_object结构体，此结构体只有一个元素即指向其类的isa指针，isa指针的类型为Class。(Class的结构体后面有）
* 每个类也是一个对象，它的isa指针指向它的元类(meta class)，一般元类都是唯一的。
* 每个元类也是一个对象，它的isa指针指向NSObject的元类，而NSObject的元类指向它本身（即NSObject元类）
* 而每个类的super class都指向它的父类，直至NSObject，NSObject的super class为null。
* 每个元类的super class都指向它的父元类，直至NSObject元类。NSObject元类的父元类是NSObject，NSObject的父类是nil。

注：上面使用代码测试过，主要使用object_getClass、class_getSuperClass和objc_getMetaClass来获取类、父类、元类，然后打印指针进行查看。

##二、类与对象基础数据结构
Objective-C类是由Class类型来表示的，它实际上是一个指向objc_class结构体的指针，它的定义如下：

```objc
typedef struct objc_class *Class;
```

查看objc/runtime.h中objc_class结构体的定义如下：

```
struct objc_class {
    Class isa  OBJC_ISA_AVAILABILITY;
 
#if !__OBJC2__
    Class super_class                       OBJC2_UNAVAILABLE;  // 父类
    const char *name                        OBJC2_UNAVAILABLE;  // 类名
    long version                            OBJC2_UNAVAILABLE;  // 类的版本信息，默认为0
    long info                               OBJC2_UNAVAILABLE;  // 类信息，供运行期使用的一些位标识
    long instance_size                      OBJC2_UNAVAILABLE;  // 该类的实例变量大小
    struct objc_ivar_list *ivars            OBJC2_UNAVAILABLE;  // 该类的成员变量链表
    struct objc_method_list **methodLists   OBJC2_UNAVAILABLE;  // 方法定义的链表
    struct objc_cache *cache                OBJC2_UNAVAILABLE;  // 方法缓存
    struct objc_protocol_list *protocols    OBJC2_UNAVAILABLE;  // 协议链表
#endif
 
} OBJC2_UNAVAILABLE;
```

##三、调用方法时的流程
首先到当前对象所属的类中的方法缓存列表中查找这个方法，如果没有则到该类的方法定义链表中查找方法，如果查找到，则执行这个方法将返回值返回给原调用对象，并且将这个方法加入缓存cache当中；如果没有查找到则通过super_class找到它的父类，到它的父类中查找。

想了解更多Runtime方法调用知识，请看[Objective-C Runtime 运行时之三：方法与消息](http://blog.jobbole.com/79574/)

##四、类与对象的操作函数
runtime提供了大量的函数来操作类与对象，操作类的函数一般前缀是class，而操作对象的函数一般前缀是objc。

####1、类相关操作函数

```
// 获取类的类名
const char * class_getName ( Class cls );
// 获取类的父类
Class class_getSuperclass ( Class cls );
 
// 判断给定的Class是否是一个元类
BOOL class_isMetaClass ( Class cls );
// 获取实例大小
size_t class_getInstanceSize ( Class cls );
```

####2、成员变量相关操作函数
```
// 获取类中指定名称实例成员变量的信息
Ivar class_getInstanceVariable ( Class cls, const char *name );
 
// 获取类成员变量的信息
Ivar class_getClassVariable ( Class cls, const char *name );
 
// 添加成员变量
BOOL class_addIvar ( Class cls, const char *name, size_t size, uint8_t alignment, const char *types );
 
// 获取整个成员变量列表
Ivar * class_copyIvarList ( Class cls, unsigned int *outCount );
```

需要注意：

* class_copyIvarList：获取的是所有成员实例属性，与property获取不一样。
* class_addIvar: **OC不支持往已存在的类中添加实例变量**，因此不管是系统库提供的类，还是我们自定义的类，都无法动态给它添加成员变量。**但，如果是我们通过运行时来创建的类，我们可以使用class_addIvar来添加。不过，需要注意的是，这个方法只能在objc_allocateClassPair函数与objc_registerClassPair之间调用。**另外，**这个类也不能是元类**。

代码测试：

```
/**
 *  测试成员变量
 */
- (void)testIvar {
    unsigned int outCount;
    if(class_addIvar([Student class], "_hell", sizeof(id), log2(sizeof(id)), "@")) {
        NSLog(@"Add Ivar Success!");
    }
    else {
        NSLog(@"Add Ivar failed!");
    }
    Ivar *ivarList = class_copyIvarList([Student class], &outCount);
    for (unsigned int i = 0; i < outCount; i++) {
        Ivar ivar = ivarList[i];
        const char *ivarName = ivar_getName(ivar);
        ptrdiff_t offset = ivar_getOffset(ivar);
        const char *types = ivar_getTypeEncoding(ivar);
        NSLog(@"ivar:%s, offset:%zd, type:%s", ivarName, offset, types);
    }
    free(ivarList);
}
```
注意：class_addIvar中第三个参数设置类型的大小，第四个参数设置对齐，对齐传递log2(size)，具体原因参考：[http://stackoverflow.com/questions/33184826/what-does-class-addivars-alignment-do-in-objective-c](http://stackoverflow.com/questions/33184826/what-does-class-addivars-alignment-do-in-objective-c)

####3、属性操作函数

```
// 获取指定的属性
objc_property_t class_getProperty ( Class cls, const char *name );
 
// 获取属性列表
objc_property_t * class_copyPropertyList ( Class cls, unsigned int *outCount );
 
// 为类添加属性
BOOL class_addProperty ( Class cls, const char *name, const objc_property_attribute_t *attributes, unsigned int attributeCount );
 
// 替换类的属性
void class_replaceProperty ( Class cls, const char *name, const objc_property_attribute_t *attributes, unsigned int attributeCount );
```

这一种方法也是针对ivar来操作的，不过它只操作那些property的值，包括扩展中的property。

代码实践：

```
- (void)testProperty {
    /**
     *  添加property
     */
    objc_property_attribute_t attribute1 = {"T", "@\"NSString\""};
    objc_property_attribute_t attribute2 = {"C", ""};
    objc_property_attribute_t attribute3 = {"N", ""};
    objc_property_attribute_t attribute4 = {"V", "_lcg"};
    objc_property_attribute_t attributesList[] = {attribute1, attribute2, attribute3, attribute4};
    if(class_addProperty([Student class], "lcg", attributesList, 4)) {
        NSLog(@"add property success!");
    }
    else {
        NSLog(@"add property failure!");
    }
    
    /**
     *  打印property的name和property_attribute_t
     */
    unsigned int outCount;
    objc_property_t *propertyList = class_copyPropertyList([Student class], &outCount);
    for (unsigned int i = 0; i < outCount; i++) {
        objc_property_t property = propertyList[i];
        const char *propertyName = property_getName(property);
        const char *attribute = property_getAttributes(property);
        NSLog(@"propertyName: %s, attribute: %s", propertyName, attribute);
        
        unsigned int attributeCount;
        objc_property_attribute_t *attributeList = property_copyAttributeList(property, &attributeCount);
        for (unsigned int j = 0; j < attributeCount; j++) {
            objc_property_attribute_t attribute = attributeList[j];
            const char *name = attribute.name;
            const char *value = attribute.value;
            NSLog(@"attribute name: %s, value: %s", name, value);
        }
    }
}
```

上面代码有几个知识点需要说一下： 

(1) 其中property_attribute的相关内容需要说明下。   
 
   property_attribute为**T@"NSString",&,N,V_exprice**时：    

* **T** 是固定的，放在第一个
* **@"NSString"** 代表这个property是一个字符串对象
* **&** 代表强引用，其中与之并列的是：'C'代表Copy，'&'代表强引用，'W'表示weak，assign为空，默认为assign。
* **N** 区分的nonatomic和atomic，默认为atomic，atomic为空，'N'代表是nonatomic
* **V_exprice** V代表变量，后面紧跟着的是成员变量名，代表这个property的成员变量名为_exprice。

 property_attribute为**T@"NSNumber",R,N,V_yearsOld**时：

* **T** 是固定的，放在第一个
* **@"NSNumber"** 代表这个property是一个NSNumber对象
* **R** 代表readOnly属性，readwrite时为空
* **N** 区分的nonatomic和atomic，默认为atomic，atomic为空，'N'代表是nonatomic
* **V_yearsOld** V代表变量，后面紧跟着的是成员变量名，代表这个property的成员变量名为_yearsOld。

使用例子参考：[http://www.tuicool.com/articles/aY3Ujii](http://www.tuicool.com/articles/aY3Ujii)    
官方参考：[Property Type](https://developer.apple.com/library/ios/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtPropertyIntrospection.html#//apple_ref/doc/uid/TP40008048-CH101-SW6)

（2） 添加property，property_attribute_t是一个结构体，没有具体创建的方法，我们就只能使用{}这样结构体直接赋值过去。而且，添加property成功之后，它并不会生成**实例属性、setter方法和getter方法**。如果要真正调用的话，还需要我们自己添加对应的setter和getter方法。    
详情使用请见：[http://blog.csdn.net/meegomeego/article/details/18356169](http://blog.csdn.net/meegomeego/article/details/18356169)

####4、协议相关函数

```
// 添加协议
BOOL class_addProtocol ( Class cls, Protocol *protocol );
 
// 返回类是否实现指定的协议
BOOL class_conformsToProtocol ( Class cls, Protocol *protocol );
 
// 返回类实现的协议列表
Protocol * class_copyProtocolList ( Class cls, unsigned int *outCount );
```

代码实践：

```
- (void)testProtocolList {
    //添加协议
    Protocol *p = @protocol(StudentDataSource);
    if(class_addProtocol([Student class], p)) {
        NSLog(@"添加协议成功!");
    }
    else {
        NSLog(@"添加协议失败!");
    }
    
    //判断是否实现了指定的协议
    if(class_conformsToProtocol([Student class], p)) {
        NSLog(@"遵循 %s协议", protocol_getName(p));
    }
    else {
        NSLog(@"不遵循 %s协议", protocol_getName(p));
    }
    
    //获取类的协议列表
    unsigned int outCount;
    Protocol * __unsafe_unretained *protocolList = class_copyProtocolList([Student class], &outCount);
    for (unsigned int i = 0; i < outCount; i++) {
        Protocol *protocol = protocolList[i];
        const char *name = protocol_getName(protocol);
        NSLog(@"%s", name);
    }
    free(protocolList);
}
```

**注意：可以使用runtime添加协议**

####6、版本号（Version)
版本的使用两个方法，获取版本和设置版本，请看代码：

```
- (void)testVersion {
    int version = class_getVersion([Student class]);
    NSLog(@"%d", version);
    class_setVersion([Student class], 100);
    version = class_getVersion([Student class]);
    NSLog(@"%d", version);
}
```

##五、动态创建类和对象
####1、动态创建类
涉及以下函数

```
// 创建一个新类和元类
Class objc_allocateClassPair ( Class superclass, const char *name, size_t extraBytes );
 
// 销毁一个类及其相关联的类
void objc_disposeClassPair ( Class cls );
 
// 在应用中注册由objc_allocateClassPair创建的类
void objc_registerClassPair ( Class cls );
```
注意：objc_disposeClassPair只能销毁由objc_allocateClassPair创建的类，当有实例存在或者它的子类存在时，调用这个函数会抛出异常。

代码实践：

```
- (void)testCreateClass {
    Class cls = objc_allocateClassPair([Person class], "Teacher", 0);
    //添加成员变量，只能在运行时创建类添加，并且是在objc_allocateClassPair与objc_registerClassPair之间
    if(class_addIvar(cls, "_level", sizeof(id), log2(sizeof(id)), "@\"NSString\"")) {
        NSLog(@"添加_level成员变量成功");
    }
    else {
        NSLog(@"添加_level成员变量失败");
    }
    objc_registerClassPair(cls);
    
    /**
     *  当有实例存在不能销毁类，所以讲代码放到里面
     */
    {
        //创建对象
        Person *p = [[cls alloc] init];
        NSLog(@"%@", [p class]);
        [p printInfo];
        //设置值
        [p setValue:@"高级讲师" forKey:@"level"];
        NSString *level = [p valueForKey:@"level"];
        NSLog(@"level: %@", level);
    }
    
    //销毁类，当有实例存在的时候是不能销毁类
    objc_disposeClassPair(cls);
}
```

##六、实例操作函数
```
// 返回指定对象的一份拷贝
id object_copy ( id obj, size_t size );
 
// 释放指定对象占用的内存
id object_dispose ( id obj );
// 修改类实例的实例变量的值
Ivar object_setInstanceVariable ( id obj, const char *name, void *value );
 
// 获取对象实例变量的值
Ivar object_getInstanceVariable ( id obj, const char *name, void **outValue );
 
// 返回指向给定对象分配的任何额外字节的指针
void * object_getIndexedIvars ( id obj );
 
// 返回对象中实例变量的值
id object_getIvar ( id obj, Ivar ivar );
 
// 设置对象中实例变量的值
void object_setIvar ( id obj, Ivar ivar, id value );
// 返回给定对象的类名
const char * object_getClassName ( id obj );
 
// 返回对象的类
Class object_getClass ( id obj );
 
// 设置对象的类
Class object_setClass ( id obj, Class cls );
```

实践代码：

```
- (void)testInstance {
    Person *p = [Person new];
    //object_copy在ARC下不能使用
//    p = object_copy(p, class_getInstanceSize([Student class]));
    //将p的isa指向Student
    object_setClass(p, [Student class]);
    [(Student *)p setName:@"Jack"];
}
```

这里只是简单的将p这个对象的class设置为Student类，其实就是将p对象的isa指针指向Student类，KVO中的isa-swizzling其实就是这样干的。当调用setName:的方法的时候，就调用到了Student类中的setName。不过，这里调用Person类没有，而Student类有的方法会崩溃，报错Heap buffer overflow，就算是在非ARC下使用object_copy也是一样。

##七、获取类的定义
```
// 获取已注册的类定义的列表
int objc_getClassList ( Class *buffer, int bufferCount );
 
// 创建并返回一个指向所有已注册类的指针列表
Class * objc_copyClassList ( unsigned int *outCount );
 
// 返回指定类的类定义
Class objc_lookUpClass ( const char *name );
Class objc_getClass ( const char *name );
Class objc_getRequiredClass ( const char *name );
 
// 返回指定类的元类
Class objc_getMetaClass ( const char *name );
```

objc_getClassList和objc_copyClassList都是获取所有已注册的类；而objc_lookUpClass获取指定的类，如果没有注册则返回nil；objc_getRequiredClass也是获取指定的类，不过如果这个类不存则，则会崩溃；objc_getMetaClass专门用来获取类的元类，每个类都有一个有效并且唯一的元类，如果这个类没有注册则返回nil。

代码实践：

```
- (void)testGetClass {
    /**
     *  第一种获取所有注册的类
     */
    Class *bufferClass;
    int numClasses;
    numClasses = objc_getClassList(NULL, 0);
    if(numClasses > 0) {
        bufferClass = (Class *)malloc(sizeof(Class)*numClasses);
        numClasses = objc_getClassList(bufferClass, numClasses);
        NSLog(@"numer of classes: %d", numClasses);
        for (int i = 0; i < numClasses; i++) {
            Class cls = bufferClass[i];
            NSLog(@"class name: %s", class_getName(cls));
        }
        free(bufferClass);
    }
    
    /**
     *  第二种获取所有注册的类
     */
    unsigned int outCount;
    Class *classLiset = objc_copyClassList(&outCount);
    for (unsigned int i = 0; i < outCount; i++) {
        Class cls = classLiset[i];
        NSLog(@"class name: %s", class_getName(cls));
    }
    free(classLiset);
}
```

第二种获取所有注册的类比第一种简单多了，建议使用第二种。

##参考
[Objective-C Runtime 运行时之一：类与对象](http://blog.jobbole.com/79566/)    

[Type Encodings](https://developer.apple.com/library/ios/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtTypeEncodings.html#//apple_ref/doc/uid/TP40008048-CH100)    

[Property Type](https://developer.apple.com/library/ios/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtPropertyIntrospection.html#//apple_ref/doc/uid/TP40008048-CH101-SW6)





