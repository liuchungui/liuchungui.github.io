---
layout: post
title: "GCD总结"
date: 2016-04-04 19:13:33 +0800
comments: true
keywords: GCD, GCD API, GCD总结
tags: [Runtime, Runtime总结, Runtime调用代码]
categories: iOS
---
###GCD的知识点：
1. queue分成两种，分别是串行队列(Serial Dispatch Queue)和并行队列（Concurrent Dispatch Queue)。
2. 串行队列只会创建一个线程，而各个串行队列之间是并行的。
3. 串行队列个数创建不受限制，也就是通过串行队列创建的线程可以有很多个，但是这样会存在消耗大量内存的问题；而并行队列不会，不管创建多少个并行队列，XNU内核只使用有效管理的线程。
4. 在iOS6以后，ARC已经实现了GCD的内存管理，所以不用我们去管理它的内存了。
5. 系统已经为我们提供了两个queue，分别是main queue和global queue，其中main queue是串行队列，global queue是并行队列。

<!-- more -->
##GCD的API：
###1、dispatch_set_target_queue
这个api有两个功能，一是设置dispatch_queue_create创建队列的优先级，二是建立队列的执行阶层。

（1）当使用dispatch_queue_create创建队列的时候，不管是串行还是并行，它们的优先级都是`DISPATCH_QUEUE_PRIORITY_DEFAULT`级别，而这个API就是可以设置队列的优先级。

如下，将serailQueue设置成`DISPATCH_QUEUE_PRIORITY_HIGH`

```objc
dispatch_queue_t serialQueue = dispatch_queue_create(kBGGCDTestIdentifier, DISPATCH_QUEUE_SERIAL);
    dispatch_queue_t globalQueue = 
dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0);
//注意：被设置优先级的队列是第一个参数。
dispatch_set_target_queue(serialQueue, globalQueue);
```

（2）使用这个API可以设置队列执行阶层，例如`dispatch_set_target_queue(queue1, targetQueue);`这样设置时，相当于将queue1指派给targetQueue，如果targetQueue是串行队列，则queue1是串行执行的；如果targetQueue是并行队列，那么queue1是并行的。

当targetQueue为串行队列时，代码：

```
const char * kBGGCDTestIdentifier = "kBGGCDTestIdentifier";
void testTargetQueue() {
    dispatch_queue_t targetQueue = dispatch_queue_create(kBGGCDTestIdentifier, DISPATCH_QUEUE_SERIAL);
    
    dispatch_queue_t queue1 = dispatch_queue_create(kBGGCDTestIdentifier, DISPATCH_QUEUE_SERIAL);
    dispatch_queue_t queue2 = dispatch_queue_create(kBGGCDTestIdentifier, DISPATCH_QUEUE_CONCURRENT);
    
    dispatch_set_target_queue(queue1, targetQueue);
    dispatch_set_target_queue(queue2, targetQueue);
    
    dispatch_async(queue1, ^{
        NSLog(@"queue1 1");
    });
    dispatch_async(queue1, ^{
        NSLog(@"queue1 2");
    });
    dispatch_async(queue2, ^{
        NSLog(@"queue2 1");
    });
    dispatch_async(queue2, ^{
        NSLog(@"queue2 2");
    });
    dispatch_async(targetQueue, ^{
        NSLog(@"target queue");
    });
}
```

输出：

```
2016-03-11 00:03:31.015 BGGCDDemo[23237:6187006] queue1 1
2016-03-11 00:03:31.015 BGGCDDemo[23237:6187006] queue1 2
2016-03-11 00:03:31.016 BGGCDDemo[23237:6187006] queue2 1
2016-03-11 00:03:31.017 BGGCDDemo[23237:6187006] queue2 2
2016-03-11 00:03:31.018 BGGCDDemo[23237:6187006] target queue
```

当上面代码中targetQueue是并行队列时

输出：

```
2016-03-11 00:04:48.234 BGGCDDemo[23331:6188776] queue2 1
2016-03-11 00:04:48.234 BGGCDDemo[23331:6188777] queue1 1
2016-03-11 00:04:48.234 BGGCDDemo[23331:6188780] queue2 2
2016-03-11 00:04:48.234 BGGCDDemo[23331:6188786] target queue
2016-03-11 00:04:48.235 BGGCDDemo[23331:6188777] queue1 2
```

参考：[http://justsee.iteye.com/blog/2233252](http://justsee.iteye.com/blog/2233252)

###2、dispatch_after
指定时间执行某些内容，例如，下面一秒后执行打印信息.

```
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        NSLog(@"test");
    });
```

###3、dispatch_group
经常会有这么个需求，就是多个queue中所有操作执行完之后，想再执行结束处理，而dispatch_group正是干这个的。它有两种操作可以做到，一种是使用dispatch_group_notify，另外一种是使用dispatch_group_wait。

它们区别是dispatch_group_notify是可以将结束追加到某个队列当中，不会阻塞当前执行的线程；而dispatch_group_wait会阻塞当前执行线程，直到group中所有处理全部执行结束或超过等待的指定时间。当然，可以使用`DISPATCH_TIME_NOW`就不用等待，然后在主线程的Runloop每次循环中，检查执行是否结束，这样就不会堵塞当前执行的线程了，不过这样实现起来就会麻烦很多。所以，推荐使用dispatch_group_notify。

使用dispatch_group_notify时，代码如下：

```
void testGroupNotification() {
    dispatch_queue_t serialQueue = dispatch_queue_create("BG.serailQueue.com", DISPATCH_QUEUE_SERIAL);
    dispatch_queue_t concurrentQueue = dispatch_queue_create("BG.concurrentQueue.com", DISPATCH_QUEUE_CONCURRENT);
    dispatch_group_t group = dispatch_group_create();
    
    dispatch_group_async(group, serialQueue, ^{
        NSLog(@"serailQueue 1");
    });
    dispatch_group_async(group, serialQueue, ^{
        NSLog(@"serailQueue 2");
    });
    dispatch_group_async(group, concurrentQueue, ^{
        NSLog(@"concurrentQueue 1");
    });
    dispatch_group_async(group, concurrentQueue, ^{
        NSLog(@"concurrentQueue 2");
    });
    dispatch_group_notify(group, dispatch_get_main_queue(), ^{
        NSLog(@"finish!");
    });
    NSLog(@"testGroupNotification");
}
```

使用dispatch_group_wait时，代码如下：

```
void testGroupWait() {
    dispatch_queue_t serialQueue = dispatch_queue_create("BG.serailQueue.com", DISPATCH_QUEUE_SERIAL);
    dispatch_queue_t concurrentQueue = dispatch_queue_create("BG.concurrentQueue.com", DISPATCH_QUEUE_CONCURRENT);
    dispatch_group_t group = dispatch_group_create();
    
    dispatch_group_async(group, serialQueue, ^{
        NSLog(@"serailQueue 1");
    });
    dispatch_group_async(group, serialQueue, ^{
        NSLog(@"serailQueue 2");
        sleep(1);
    });
    dispatch_group_async(group, concurrentQueue, ^{
        NSLog(@"concurrentQueue 1");
    });
    dispatch_group_async(group, concurrentQueue, ^{
        NSLog(@"concurrentQueue 2");
    });
    dispatch_group_wait(group, DISPATCH_TIME_FOREVER);
    NSLog(@"testGroupNotification");
}
```

###4、dispatch_barrier_async
dispatch_barrier_async加入的处理，会等待队列中所有的处理结束后才执行barrier当中的处理，而且只有等待barrier执行完之后，才会继续执行后续处理。**使用并行队列和dispatch_barrier_async可以做到很高效的数据库或文件访问**。

测试代码如下：

```
void testBarrier() {
    dispatch_queue_t concurrentQueue = dispatch_queue_create("BG.concurrent.com", DISPATCH_QUEUE_CONCURRENT);
    dispatch_async(concurrentQueue, ^{
        NSLog(@"reading 1");
    });
    dispatch_async(concurrentQueue, ^{
        NSLog(@"reading 2");
    });
    dispatch_async(concurrentQueue, ^{
        NSLog(@"reading 3");
    });
    dispatch_barrier_async(concurrentQueue, ^{
        NSLog(@"writing");
    });
    dispatch_async(concurrentQueue, ^{
        NSLog(@"reading 4");
    });
    dispatch_async(concurrentQueue, ^{
        NSLog(@"reading 5");
    });
}
```
输出结果：

```
2016-03-11 10:31:47.980 BGGCDDemo[28694:6276100] reading 2
2016-03-11 10:31:47.980 BGGCDDemo[28694:6276099] reading 1
2016-03-11 10:31:47.981 BGGCDDemo[28694:6276102] reading 3
2016-03-11 10:31:47.981 BGGCDDemo[28694:6276102] writing
2016-03-11 10:31:47.982 BGGCDDemo[28694:6276102] reading 4
2016-03-11 10:31:47.982 BGGCDDemo[28694:6276099] reading 5
```


###5、dispatch_sync
与dispatch_async异步不同的是dispatch_sync会等待当前处理结束之后有返回结果时才会继续往下走。与dispatch_group_wait有点类似，当使用dispatch_sync时，当前线程会被阻塞，直到它有返回结果为止。

代码：

```
void testSync() {
    dispatch_queue_t serialQueue = dispatch_queue_create("BG.serailQueue.com", DISPATCH_QUEUE_SERIAL);
    dispatch_queue_t concurrentQueue = dispatch_queue_create("BG.concurrent.com", DISPATCH_QUEUE_CONCURRENT);
    dispatch_sync(serialQueue, ^{
        NSLog(@"test");
    });
    dispatch_sync(concurrentQueue, ^{
        NSLog(@"test2");
    });
    NSLog(@"finish");
}
```

输出：

```
2016-03-11 10:35:43.166 BGGCDDemo[28912:6278490] test
2016-03-11 10:35:43.167 BGGCDDemo[28912:6278490] test2
2016-03-11 10:35:43.167 BGGCDDemo[28912:6278490] finish
```

使用dispatch_sync很容易造成死锁，如下代码在主线程中运行就会造成死锁：

```
    dispatch_sync(dispatch_get_main_queue(), ^{
        NSLog(@"test");
    });
```
分析：主线程会等待dispatch_sync函数返回，而dispatch_sync要等block执行完才会返回。而主线程是串行队列，采用FIFO队列执行任务，dispatch_sync加入的block是后加入的，这样的话这个block是得不到执行的，从而产生了死锁。

**官方文档指出：dispatch_sync的当前执行队列与提交block执行的目标队列相同时并且是串行队列时将造成死锁。**

参考：
[dispatch_sync死锁问题研究](http://www.jianshu.com/p/44369c02b62a)
[GCD 之线程死锁](http://www.cnblogs.com/tangbinblog/p/4133481.html)

###6、dispatch_apply
dispatch_apply函数是dispatch_sync和DISPATCH Group的关联API。该函数按指定的次数将指定的Block追加到指定的队列当中，并等待全部处理执行结束。

代码：

```
void testApply() {
    dispatch_queue_t concurrentQueue = dispatch_queue_create("BG.concurrent.com", DISPATCH_QUEUE_CONCURRENT);
    dispatch_apply(5, concurrentQueue, ^(size_t index) {
        NSLog(@"%zd", index);
    });
    NSLog(@"done!");
}
```
输出：

```
2016-03-11 12:08:35.524 BGGCDDemo[32542:6331022] 0
2016-03-11 12:08:35.524 BGGCDDemo[32542:6331025] 2
2016-03-11 12:08:35.524 BGGCDDemo[32542:6330953] 1
2016-03-11 12:08:35.524 BGGCDDemo[32542:6331023] 3
2016-03-11 12:08:35.525 BGGCDDemo[32542:6331022] 4
2016-03-11 12:08:35.525 BGGCDDemo[32542:6330953] done!
```

**注意：因为dispatch_apply会让当前执行的线程等待，阻塞线程，因此最好将它放在dispatch_async中执行。**

###7、dispatch_suspend/dispatch_resume
dispatch_suspend可以暂停当前队列的执行，dispatch_resume恢复当前队列的执行。
这两个函数都已经执行的处理没有影响。挂起后，追加到queue中但尚未执行的处理在此之后停止执行。而恢复则使得这些处理能够继续执行。

###8、Dispatch Semaphore
信号量，更细粒度的处理资源竞争的方案。    
主要用到三个方法dispatch_semaphore_create、dispatch_semaphore_wait、dispatch_semaphore_signal。

* dispatch_semaphore_create：创建一个dispatch_semaphore_t，并且初始化Dispatch Semaphore的计数值；
* dispatch_semaphore_wait：等待Dispatch Semaphore的计数值大于等于1，如果大于等于1，则计数值减1并且往下继续执行；如果等于0，则一直等待计数值增加。
* dispatch_semaphore_sigal：将Dispatch Semaphore的计数值加1

这三个方法配合使用，如下：

```
void testSemaphore() {
    dispatch_queue_t concurrentQueue = dispatch_queue_create("BG.concurrentQueue.com", DISPATCH_QUEUE_CONCURRENT);
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(1);
    NSMutableArray *array = [NSMutableArray array];
    for (NSInteger i = 0; i < 10000; i++) {
        dispatch_async(concurrentQueue, ^{
            dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
            [array addObject:[NSNumber numberWithInteger:i]];
            dispatch_semaphore_signal(semaphore);
            NSLog(@"%zd", i);
        });
    }
}
```

###9、dispatch_once
保证在应用程序中只执行一次指定的处理，一般应用场景就是单例了。


###10、dispatch_source
与Dispatch Queue不同的是，dispatch_source是可以进行取消的，而且可以添加取消的block回调；dispatch_source可以做异步读取文件映像、定时器、监听文件目录变化等等，具体请见下表：

| 方法 | 说明 |
| :----------------- | :------------------ |
| DISPATCH_SOURCE_TYPE_DATA_ADD | 数据增加 |
| DISPATCH_SOURCE_TYPE_DATA_OR | 数据OR |
| DISPATCH_SOURCE_TYPE_MACH_SEND | Mach端口发送 |
| DISPATCH_SOURCE_TYPE_MACH_RECV | Mach端口接收 |
| DISPATCH_SOURCE_TYPE_MEMORYPRESSURE | 内存情况 |
| DISPATCH_SOURCE_TYPE_PROC | 进程事件 |
| DISPATCH_SOURCE_TYPE_READ | 读数据 |
| DISPATCH_SOURCE_TYPE_SIGNAL | 信号 |
| DISPATCH_SOURCE_TYPE_TIMER | 定时器 |
| DISPATCH_SOURCE_TYPE_VNODE | 文件系统变化 |
| DISPATCH_SOURCE_TYPE_WRITE | 文件写入 |  



定时器代码：

```
- (void)testSourceTimer {
    //定时器在主线程运行
    dispatch_source_t timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, dispatch_get_main_queue());
    //设置定时器每隔2秒调用一次，允许延迟1秒
    dispatch_source_set_timer(timer, DISPATCH_TIME_NOW, 2.0 * NSEC_PER_SEC, 1.0 * NSEC_PER_SEC);
    //定时器执行的处理
    dispatch_source_set_event_handler(timer, ^{
        NSLog(@"timer work");
//        dispatch_source_cancel(timer);
    });
    //定时器取消所做的处理
    dispatch_source_set_cancel_handler(timer, ^{
        NSLog(@"timer cancel!");
    });
    //需要将定时器设置为全局变量，否则就会被提前释放
    self.timer = timer;
    //启动定时器
    dispatch_resume(timer);
}
```

监听文件夹变化代码：

```
- (void)testSourceForObservFile {
    //创建文件夹，写入文件，用来进行测试
    NSString *cacheDirectory = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) firstObject];
    NSString *directory = [NSString stringWithFormat:@"%@/test", cacheDirectory];
    if(![[NSFileManager defaultManager] fileExistsAtPath:directory isDirectory:nil]) {
        [[NSFileManager defaultManager] createDirectoryAtPath:directory withIntermediateDirectories:YES attributes:nil error:nil];
    }
    NSString *filePath = [NSString stringWithFormat:@"%@/test.txt", directory];
    if(![[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
        [@"hello" writeToFile:filePath atomically:YES encoding:NSUTF8StringEncoding error:nil];
    }
    
    NSURL *directoryURL = [NSURL URLWithString:directory]; // assume this is set to a directory
    int const fd = open([[directoryURL path] fileSystemRepresentation], O_EVTONLY);
    if (fd < 0) {
        char buffer[80];
        strerror_r(errno, buffer, sizeof(buffer));
        NSLog(@"Unable to open \"%@\": %s (%d)", [directoryURL path], buffer, errno);
        return;
    }
    //设置源监听文件夹的变化，其中监听的是写入、删除、更改名字
    dispatch_source_t source = dispatch_source_create(DISPATCH_SOURCE_TYPE_VNODE, fd,
                                                      DISPATCH_VNODE_WRITE | DISPATCH_VNODE_DELETE | DISPATCH_VNODE_RENAME, DISPATCH_TARGET_QUEUE_DEFAULT);
    dispatch_source_set_event_handler(source, ^(){
        //获取源变化的具体标志
        unsigned long const data = dispatch_source_get_data(source);
        if (data & DISPATCH_VNODE_WRITE) {
            NSLog(@"The directory changed.");
        }
        if (data & DISPATCH_VNODE_DELETE) {
            NSLog(@"The directory has been deleted.");
        }
    });
    dispatch_source_set_cancel_handler(source, ^(){
        close(fd);
    });
    self.source = source;
    dispatch_resume(self.source);
}
```

参考：[细说GCD如何使用](https://github.com/ming1016/study/wiki/%E7%BB%86%E8%AF%B4GCD%EF%BC%88Grand-Central-Dispatch%EF%BC%89%E5%A6%82%E4%BD%95%E7%94%A8)
