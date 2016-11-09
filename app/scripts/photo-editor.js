/**
 * 图片编辑模块
 * 手机上传图片bug
 * orient = 3 => 图片顺时针旋转了180°
 * orient = 6 => 图片顺时针旋转了270°
 * orient = 8 => 图片顺时针旋转了90°
 */
;
(function(global, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['PIXI', 'Hammer'], factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory(require('PIXI'), require('Hammer'));
  } else {
    // Browser globals
    global.photoEditor = factory(global.PIXI, global.Hammer);
  }
}(window, function(PIXI, Hammer) {
  var photoEditor = {},
    document = window.document;

  // stage配置属性
  var stageConfig = {
      width: 500, // 宽度
      height: 500, // 高度
      bgColor: 0xBBBBBB, // 背景色
      $canvasEl: '#canvas', // 元素
      autoFixStage: true, // 图片在stage中全屏显示
      animated: true, // 开启页面动画
      touched: true, // 开启手势事件
      hasFilters: true // 开启滤镜
    },
    filterList = {},
    stage,
    renderer,
    sprite,
    imgSource,
    imgType,
    orient,
    hammertime,
    current;

  function animate() {
    if (stageConfig.animated) {
      requestAnimationFrame(animate);
      renderer.render(stage);
    }
  }

  /**
   * 属性赋值
   * @param {Object} des 目标属性对象
   * @param {Object} src 输入的新属性对象
   */
  function clone(des, src) {
    var prop;

    for (prop in src) {
      if (des.hasOwnProperty(prop)) {
        des[prop] = src[prop];
      }
    }
  };

  // 手机图片bug处理
  function processImage() {
    var ioreader = new FileReader(),
      result;
    ioreader.onload = function(event) {
      result = event.target.result;

      orient = getImageOrientation(result);
      ioReaderCallback();
    };
    ioreader.readAsArrayBuffer(imgSource);
  }

  // 获取图片orient
  function getImageOrientation(res) {
    var view = new DataView(res),
      length,
      offset,
      marker,
      little,
      tags,
      i;

    if (view.getUint16(0, false) !== 0xFFD8) {
      return -2;
    }

    length = view.byteLength;
    offset = 2;
    while (offset < length) {
      marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 0xFFE1) {
        if (view.getUint32(offset += 2, false) !== 0x45786966) {
          return -1;
        }
        little = view.getUint16(offset += 6, false) === 0x4949;
        offset += view.getUint32(offset + 4, little);
        tags = view.getUint16(offset, little);
        offset += 2;
        for (i = 0; i < tags; i++) {
          if (view.getUint16(offset + (i * 12), little) === 0x0112) {
            return view.getUint16(offset + (i * 12) + 8, little);
          }
        }
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break;
      } else {
        offset += view.getUint16(offset, false);
      }
    }
    return -1;
  };

  // 图片处理回调函数
  function ioReaderCallback() {
    var image = new Image(),
      defaultOrientArr = [3, 6, 8],
      URL = window.URL || window.webkitURL,
      blob = URL.createObjectURL(imgSource);

    image.onload = function() {
      defaultOrientArr;

      if (defaultOrientArr.indexOf(orient) > -1) {
        switch (orient) {
          case 3:
            drawSprite({
              img: this,
              rotate: Math.PI / 180 * 180
            });
            break;
          case 6:
            drawSprite({
              img: this,
              rotate: Math.PI / 180 * 90
            });
            break;
          default:
            drawSprite({
              img: this,
              rotate: Math.PI / 180 * (-90)
            });
            break;
        }
      } else {
        drawSprite({
          img: this
        });
      }
    };
    image.src = blob;
  }

  function drawSprite(params) {
    var imgW = stageConfig.width,
      imgH = stageConfig.width * (params.img.height / params.img.width),
      sprite = PIXI.Sprite.fromImage(params.img.src);

    if (stageConfig.autoFixStage) {
      sprite.width = imgW;
      sprite.height = imgH;
    }
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;
    sprite.position.x = (stageConfig.width - imgW) / 2 + (imgW / 2);
    sprite.position.y = (stageConfig.width - imgH) / 2 + (imgH / 2);
    sprite.rotation = params.rotate || 0;
    sprite.interactive = true;
    sprite.imgType = imgType;

    // 默认最新上传的图片为当前图片
    current = sprite;

    if (stageConfig.touched) {
      sprite
        .on('mousedown', getCurrentSprite)
        .on('touchstart', getCurrentSprite);
    }

    stage.addChild(sprite);
  }

  // 获取当前点击的图片
  function getCurrentSprite() {
    current = this;

    // 初始拖动X位置
    current.startX = this.position.x;

    // 初始拖动Y位置
    current.startY = this.position.y;

    // 初始缩放
    current.initScale = 1;

    current.panning = true;
  }

  // 开关手势监测
  function switchTouchEvent() {
    if (stageConfig.animated && stageConfig.touched) {
      hammertime = new Hammer.Manager(renderer.view);

      hammertime.add(new Hammer.Tap({
        event: 'doubletap',
        taps: 2
      }));
      hammertime.add(new Hammer.Pan());
      hammertime.add(new Hammer.Pinch());

      hammertime.on('doubletap', onDoubleTap);
      hammertime.on('pinchstart pinchin pinchout', onPinch);
      hammertime.on('panmove', onPan);
      hammertime.on('hammer.input', onFinal);
    } else {
      hammertime.off('doubletap pinchstart pinchin pinchout panmove hammer.input');
    }
  }

  // 监测拖动
  function onPan(e) {
    e.preventDefault();
    if (current && current.panning) {
      current.position.x = current.startX + e.deltaX;
      current.position.y = current.startY + e.deltaY;
    }
  }

  // 监测缩放
  function onPinch(e) {
    e.preventDefault();
    if (current) {
      if (e.type === 'pinchstart') {
        current.initScale = current.scale.x || 1;
      }
      current.scale.x = current.initScale * e.scale;
      current.scale.y = current.initScale * e.scale;
    }
  }

  // 监测双击
  function onDoubleTap(e) {
    e.preventDefault();
    if (current) {
      stage.removeChild(current);
    }
  }

  // 监测离开或者事件结束
  function onFinal(e) {
    if (current && e.isFinal) {
      current.startX = current.position.x;
      current.startY = current.position.y;
      current.panning = false;
    }
  }

  /**
   * 按分类获取图片
   * @param {String} type 图片类别
   * @return {Array} spriteList 图片对象数组
   */
  function getSpriteByType(type) {
    var arr = stage.children,
      spriteList,
      len,
      i;

    if (!type) {
      return arr;
    }

    spriteList = [];
    for (i = 0, len = arr.length; i < len; i++) {
      if (arr[i].imgType === type) {
        spriteList.push(arr[i]);
      }
    }

    return spriteList;
  }

  /**
   * 初始化canvas
   * @param  {Object} [params=stageConfig] 自定义画布属性
   */
  photoEditor.init = function(params) {
    clone(stageConfig, params);

    stage = new PIXI.Container();
    renderer = new PIXI.WebGLRenderer(stageConfig.width, stageConfig.height, {
      backgroundColor: stageConfig.bgColor
    });

    document.querySelector(stageConfig.$canvasEl).appendChild(renderer.view);

    if (stageConfig.hasFilters) {
      // 设置滤镜
      filterList.Blur = new PIXI.filters.BlurFilter();
      filterList.Noise = new PIXI.filters.NoiseFilter();
      filterList.ColorMatrix = new PIXI.filters.ColorMatrixFilter();
      filterList.ColorMatrix.blackAndWhite(true);
      filterList.Bloom = new PIXI.filters.BloomFilter();
      filterList.Convolution = new PIXI.filters.ConvolutionFilter([0, 0, 0, 1, 1, 1, 0, 0, 0], stageConfig.width, stageConfig.height);
      filterList.CrossHatch = new PIXI.filters.CrossHatchFilter();
      filterList.Dot = new PIXI.filters.DotFilter();
      filterList.Emboss = new PIXI.filters.EmbossFilter();
      filterList.RGBSplit = new PIXI.filters.RGBSplitFilter();
      filterList.Twist = new PIXI.filters.TwistFilter()
      filterList.Twist.radius = 100;
      filterList.Twist.angle = 2;
      filterList.Twist.offset = new PIXI.Point(stageConfig.width / 2, stageConfig.height / 2);
    }

    switchTouchEvent();
    animate();
  };

  // 清空canvas
  photoEditor.clear = function() {
    stage.removeChildren();
  };

  /**
   * 添加图片元素
   * @param {String} fileInput 图片路径
   * @param {String} type 图片分类
   */
  photoEditor.addSprite = function(fileInput, type) {
    if (!fileInput || !type) {
      console.log('add image fail!');
      return;
    }

    imgSource = fileInput;
    imgType = type
    processImage();
  };

  /**
   * 删除图片
   * @param  {Object} [sprite=current] 需要删除的sprite
   */
  photoEditor.removeSprite = function(sprite) {
    stage.removeChild(sprite || current);
  };

  // 是否开启页面动画，用于canvas实时刷新
  photoEditor.switchAnimate = function() {
    stageConfig.animated = !stageConfig.animated;

    switchTouchEvent();
  };

  // 是否开启手势事件
  photoEditor.switchTouchEvent = function() {
    stageConfig.touched = !stageConfig.touched;

    switchTouchEvent();
  };

  /**
   * 添加滤镜
   * @param  {String} type 图片分类
   * @param  {Array} filters 滤镜数组
   */
  photoEditor.addFilter = function(type, filters) {
    var spriteList = getSpriteByType('image'),
      currentFilters = [],
      len,
      i;

    for (i = 0, len = filters.length; i < len; i++) {
      currentFilters.push(filterList[filters[i]]);
    }

    for (i = 0, len = spriteList.length; i < len; i++) {
      spriteList[i].filters = currentFilters;
    }
  };

  /**
   * 导出stage
   * 在iOS下，由于WebGL标准未定义toDataURL方法，直接渲染图片会出现上下颠倒的情况，因此需要先将图片保存入canvas中
   * @param {String} [type='image/jpeg'] 图片格式
   * @param {Number} [encoderOptions=0.92] 图片质量，取值范围为 0 到 1
   * @return {String} 图片转成Base64格式字符串
   */
  photoEditor.renderStage = function(type, encoderOptions) {
    animate();

    var sourceCanvas = renderer.extract.canvas(),
      sourceContext = sourceCanvas.getContext('2d'),
      extractCanvas = document.createElement('canvas'),
      extractContext = extractCanvas.getContext('2d'),
      imageData = sourceContext.getImageData(0, 0, stageConfig.width, stageConfig.height);

    extractCanvas.width = stageConfig.width;
    extractCanvas.height = stageConfig.height;
    extractContext.putImageData(imageData, 0, 0);

    return extractCanvas.toDataURL(type, encoderOptions);
  };

  return photoEditor;
}));
