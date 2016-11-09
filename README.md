# PhotoEditingModule 前端模块
[demo](http://display.6edigital.com/PhotoEditingModule_frontend/)
---
## 依赖库
- [Canvas库 PixiJS ^4.0.3](http://www.pixijs.com/)
- [手势监测 HAMMER.JS ^2.0.8](http://hammerjs.github.io/)

## 初始化
```
<script src="scripts/pixi.js"></script>
<script src="scripts/hammer.js"></script>
<script src="scripts/photo-editor.js"></script>
<script>
    photoEditor.init();
</script>
```
## 配置属性
```
photoEditor.init({
  width: 500,
  height: 500,
  bgColor: 0xBBBBBB,
  $canvasEl: '#canvas',
  autoFixStage: true,
  animated: true,
  touched: true
});
```
- width: (default: 500) 宽度
- height: (default: 500) 高度 
- bgColor: (default: 0xBBBBBB) canvas背景色
- $canvasEl: (default: '#canvas') canvas元素节点
- autoFixStage: (default: true) 图片在stage中全屏显示
- animated: (default: true) 开启页面动画
- touched: (default: true) 开启手势事件

## 方法调用
- 清空canvas
```
photoEditor.clear()
```

- 添加图片元素
```
/**
 * 添加图片元素
 * @param {String} fileInput 图片路径
 */
photoEditor.addSprite(fileInput)
```

- 删除图片
```
/**
 * 删除图片
 * @param  {Object} [sprite=current] 需要删除的sprite
 */
photoEditor.removeSprite(sprite)
```

- 是否开启页面动画，用于canvas实时刷新
```
/**
 * 是否开启页面动画，用于canvas实时刷新
 */
photoEditor.switchAnimate()
```

- 是否开启手势事件
```
/**
 * 是否开启手势事件
 */
photoEditor.switchTouchEvent()
```

- 添加滤镜
```
/**
 * 添加滤镜
 * @param  {String} type 图片分类
 * @param  {Array} filters 滤镜数组
 */
photoEditor.addFilter(type, filters)
```

- 导出stage
```
/**
 * 导出stage
 * @param {string} [type='image/jpeg'] 图片格式
 * @param {Number} [encoderOptions=0.92] 图片质量，取值范围为 0 到 1
 * @return {string} 图片转成Base64格式字符串
 */
photoEditor.renderStage()
```