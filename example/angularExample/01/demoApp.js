/**
 * Created by liuchungui on 16/10/2.
 */
'use strict';

var demoApp = angular.module('demoApp', []);

demoApp.controller('demoController', function ($scope, $http) {
    /**
     * 获取imageList.json文件中的json数据
     */
    $http.get('resource/imageList.json').success(function (data) {
        console.log(data);
        //绑定到scope当中的图片列表中
        $scope.imageList = data;
    }).error(function (error) {
        console.log(error);
    });

    /**
     * 设置图片的宽和高
     */
    $scope.imageStyle = function(width) {
        var windowWidth = window.document.body.clientWidth;
        var scale = windowWidth/1932;
        return {
            'height': parseInt(352*scale) + 'px',
            'width': parseInt((windowWidth-36)/4) + 'px'
        };
    };

    /**
     * jquery事件
     * resize是当窗口变化时,会触发resize事件
     */
    $(window).resize(function(){
        /**
         * angular 事件, 重新更新界面, 做手动刷新
         */
        $scope.$apply(function(){
            //do something to update current scope based on the new innerWidth and let angular update the view.
        });
    });

    $scope.search = {};
    /**
     * 删除图片
     * @param index
     */
    $scope.removePhoto = function (info) {
        info.is_hide = true;
    };

    /**
     * 按钮点击选择类型的事件
     * @param type
     */
    $scope.selectType = function (type) {
        $scope.search.type = type;
    };

});
