/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
 var MyLayer = cc.LayerColor.extend({
    plane: null

    , _bullets: null

    , _targets: null

    , init: function () {
        // 1. super init first
        // 必须调用父类init()方法，很多bug都是由于没有调用父类init()方法造成的
        this._super();

        // 用来装子弹的数组
        this._bullets = [];

        // 用来敌机器的数组
        this._targets = [];

        // 设置Layer的背景，使用RGBA
        this.setColor(cc.c4(126,126,126,126));
        
        this.director = cc.Director.getInstance();

        // 获得游戏屏幕的尺寸
        var winSize = cc.Director.getInstance().getWinSize();
        // 获取屏幕坐标原点
        var origin = cc.Director.getInstance().getVisibleOrigin();
 
        // 背景循环
        this.bg_1 = cc.Sprite.create(s_Background, cc.rect(0,0,480,852)); 
        this.bg_1.setAnchorPoint( cc.p( 0, 0 ) );  
        this.bg_1.setPosition( cc.p( 0, 0 ) );  
        this.addChild(this.bg_1, 0);  
         
        this.bg_2 = cc.Sprite.create(s_Background, cc.rect(0,0,480,852)); 
        this.bg_2.setAnchorPoint( cc.p( 0, 0 ) ); 
        // 这里减2的目的是为了防止图片交界的黑线 
        this.bg_2.setPosition( cc.p( 0, this.bg_2.getContentSize().height - 2 ) );
        this.addChild(this.bg_2, 0); 

        // 创建一个飞机，游戏中大部分物体都能使用cc.Sprite表示
        // 飞机的图案按照cc.rect(x,y,width,height）从图片中截取
        // 以（x,y）为左上角，width为宽，height为高的矩形
        this.plane = cc.Sprite.create(s_Sprites, cc.rect(56,533,98,115));
        // 将飞机设置在屏幕底部，居中的位置
        // 图片的锚点在矩形的中心点，设置的就是这个点的位置
        var point_x = origin.x + winSize.width/2
            ,point_y = origin.y + this.plane.getContentSize().height/2 + winSize.width/5;
        this.plane.setPosition( cc.p( point_x, point_y ) );

        this.addChild(this.plane, 0);

        // 设置定时器，定时器每隔0.8秒调用一次bgMove方法
        this.schedule(this.bgMove, 0.01 / 60);

        // 设置定时器，定时器每隔0.2秒调用一次addBullet方法
        this.schedule(this.addBullet, 0.2);

        // 添加增加敌机的定时器
        this.schedule(this.addTarget, 0.8);

        // 添加碰撞检测，不加第二个参数，默认为每帧执行一次
        this.schedule(this.updateGame);

        // 将层设置为可触摸
        this.setTouchEnabled(true);  

        // 场景切换
        var FadeTRTransition = function (t, s) {
            return cc.TransitionFadeTR.create(t, s);
        };    
        var FadeTransition = function (t, s) {
            return cc.TransitionFade.create(t, s);
        };        
        this.arrayOfTransitionsTest = [
            {title:"FadeTransition", transitionFunc:function (t, s) {
                return new FadeTransition(t, s);
            }}
        ];    
        if( 'opengl' in sys.capabilities ){   
            this.arrayOfTransitionsTest = [
                { title: "FadeTRTransition", transitionFunc: function (t, s) {
                    return new FadeTRTransition(t, s);
                }}
            ];         
        }
        return true;
    }

    , prevMS : 0

    , currMS : 0

    , rotateDeg : 45

    , TAG_ENEMY: 1

    , TAG_BULLET: 6

    , isGameOver: false

    , onDoubleTouches: function( touches ){
        this.rotateDeg = this.rotateDeg + 45 >= 360 ? 0 : this.rotateDeg + 45;  
        rotateTo = cc.RotateTo.create(2, this.rotateDeg);
        this.plane.runAction(rotateTo);
    }

    , onTouchesMoved: function( touches ){
        var touch = touches[0];
        var location = touch.getLocation();
        if ( this.onClickFlag ) {
            this.plane.setPosition(location);
        }
    }
 
    , onTouchesEnded: function( touches ){
        this.onClickFlag = false;
    }
 
    , onTouchesBegan: function( touches ){
        var touch = touches[0];
        var location = touch.getLocation();
        if ( cc.rectContainsPoint(this.plane.getBoundingBox(), location) ){
            this.onClickFlag = true;
        }

        // 触发双击事件
        if ( this.prevMS === 0 ) {
            this.prevMS = new Date().getTime();
        } else {
            var delTime = ( new Date().getTime() - this.prevMS ) / 1e3;
            if( delTime < 0.2 ) {
                this.onDoubleTouches(touches);
            }
            this.prevMS = 0;
        }
    }

    , bgMove: function(){
        this.bg_1.setPositionY( this.bg_1.getPositionY() - 2 );
        this.bg_2.setPositionY( this.bg_1.getPositionY() + this.bg_1.getContentSize().height-2 );
        // 要注意因为背景图高度是842，所以每次减去2最后可以到达0，假如背景高度是841，那么这个条件永远达不到，滚动失败 
        if ( this.bg_2.getPositionY() === 0 ) {  
            this.bg_1.setPositionY(0);  
        }  
    }

    , addBullet: function(){
        var winSize = cc.Director.getInstance().getWinSize();
        var origin = cc.Director.getInstance().getVisibleOrigin();
        // 获得飞机的位置
        var planePosition = this.plane.getPosition();
        // 子弹穿越屏幕要花费的秒数
        var bulletDuration = 1;
 
        // 创建一个子弹
        var bullet = cc.Sprite.create(s_Sprites, cc.rect(0, 1001, 12, 23));
 
        // 根据飞机的位置，初始化子弹的位置
        bullet.setPosition( cc.p(planePosition.x, planePosition.y) );
 
        // 一个移动的动作
        // 第一个参数为移动到目标所需要花费的秒数，为了保持速度不变，需要按移动的距离与屏幕高度按比例计算出花费的秒数
        var bullet_distance = winSize.height - planePosition.y
            ,duration = ( bullet_distance / winSize.height ) * bulletDuration
            ,point_x = planePosition.x
            ,point_y = origin.y + winSize.height + bullet.getContentSize().height
            ,point = cc.p( point_x, point_y );
        var actionMove = cc.MoveTo.create( bulletDuration, point );

        // 设置一个回调函数，移动完毕后回调spriteMoveFinished（）方法。
        var actionMoveDone = cc.CallFunc.create(this.spriteMoveFinished, this);
        // 让子弹执行动作
        bullet.runAction( cc.Sequence.create( actionMove, actionMoveDone ) );
        // 为子弹设置标签，以后可以根据这个标签判断是否这个元素为子弹
        bullet.setTag(this.TAG_BULLET);
 
        this._bullets.push(bullet);
        this.addChild(bullet, 0);
    } 

    , addTarget: function(){
        var target = cc.Sprite.create(s_Sprites, cc.rect(2,101,69,88));
        target.setTag(this.TAG_ENEMY);
 
        var winSize = cc.Director.getInstance().getWinSize();
 
        // 设置敌机随机出现的X轴的值
        var minX = target.getContentSize().width/2;
        var maxX = winSize.width - target.getContentSize().width/2;
        var rangeX = maxX - minX;
        var actualX = Math.random() * rangeX + minX;

        // 在一定范围内随机敌机的速度
        var minDuration = 2.5;
        var maxDuration = 4;
        var rangeDuration = maxDuration - minDuration;
        var actualDuration = Math.random() * rangeDuration + minDuration;
 
        var point_x = actualX
            ,point_y = winSize.height + target.getContentSize().height/2;
        target.setPosition( cc.p( point_x, point_y ) );
 
        var actionMove = cc.MoveTo.create(actualDuration, cc.p(actualX, 0 - target.getContentSize().height));
        var actionMoveDone = cc.CallFunc.create(this.spriteMoveFinished, this);
 
        target.runAction( cc.Sequence.create(actionMove, actionMoveDone) );
 
        this.addChild(target, 0);
        this._targets.push(target);
    }   

    // 转换场景
    , changeScene: function(){
        // 显示GameOver 
        this.isGameOver = true;
        var gameOverScene = GameOverScene.create();
        var actualIdx = Math.floor( Math.random() * this.arrayOfTransitionsTest.length );
        var scene = this.arrayOfTransitionsTest[ actualIdx ].transitionFunc(1.5, gameOverScene);                 
        this.director.replaceScene(scene);
    }

    , updateGame: function(){
        if( this.isGameOver ) return;

        var targets2Delete = [];
 
        var i ;

        //遍历屏幕上的每个敌机
        for( i in this._targets ){
            // console.log("targetIterator");
            var target = this._targets[i];
            // 获得敌机的碰撞矩形
            var targetRect = target.getBoundingBox();
            // 获得英雄机的碰撞矩形
            var planeRect = this.plane.getBoundingBox();
            planeRect.width = 39;
            planeRect.height = 52; 
            planeRect.x += 30;
            planeRect.y += 30;

            // 假如碰到英雄机，就显示GameOver  
            if ( cc.rectIntersectsRect( planeRect, targetRect ) ) { // 判断两个矩形是否碰撞
                // 显示GameOver 
                this.changeScene();
                return; 
            }            

            var bullets2Delete = [];
            // 对于每个敌机，遍历每个屏幕上的子弹，判断是否碰撞
            for (i in this._bullets) {
                var bullet = this._bullets[i];
                var bulletRect = bullet.getBoundingBox();
                // 判断两个矩形是否碰撞
                if (cc.rectIntersectsRect(bulletRect, targetRect)) {
                    // 碰撞则将子弹加入待删除列表
                    bullets2Delete.push(bullet);
                }
            }
            // 如果待删除的子弹数组的内容大于零，说明敌机碰到了子弹，将敌机加入待删除数组
            if (bullets2Delete.length > 0) {
                targets2Delete.push(target);
            }
 
            // 删除发生碰撞的每个子弹
            for (i in bullets2Delete) {
                var bullet = bullets2Delete;
                var index = this._bullets.indexOf(bullet);
                if (index > -1) {
                    this._bullets.splice(index, 1);
                }
                this.removeChild(bullet);
            }
 
            bullets2Delete = null;
        }
        //删除发生碰撞的每个敌机
        for( i in targets2Delete ) {
            var target = targets2Delete[i];
 
            var index = this._targets.indexOf(target);
            if (index > -1) {
                this._targets.splice(index, 1);
            }
 
            this.removeChild(target);
        }
 
        targets2Delete = null;
    }  

    , spriteMoveFinished: function( sprite ){
        // 将元素移除出Layer
        this.removeChild(sprite, true);
        if( sprite.getTag() == this.TAG_ENEMY ){
            // 把目标从数组中移除
            var index = this._targets.indexOf(sprite);
            if (index > -1) {
                this._targets.splice(index, 1);
            }
        } else if( sprite.getTag() == this.TAG_BULLET ){
            // 把子弹从数组中移除
            var index = this._bullets.indexOf(sprite);
            if (index > -1) {
                this._bullets.splice(index, 1);
            }
        }        
    }     
});

var MyScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new MyLayer();
        this.addChild(layer);
        layer.init();
    }  
});