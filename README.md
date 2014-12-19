# Detect element resize

实现来源于 https://github.com/sdecima/javascript-detect-element-resize。这里做了模块化封装。
暴露出 `config` 方法，避免代码中的关键帧动画名和样式名与业务代码中定义的冲突，并优化部分代码。

## 特性

- 基于 `scroll` 事件来检测元素大小改变，而不是基于 Timer，性能很好
- 除了能检测 JavaScript 引起的元素大小改变，还能检测由 CSS(:hover, animations) 引起的大小改变

## 兼容

- Chrome
- Firefox
- IE11 及一下（在 IE11 10 9 8 7 上做过测试）

## 注意

该实现会在页面头部引入必要的 CSS 样式，在被检测的元素内部引入一些 `div` 标签，所以需要注意这些引入的第三方代码是否会与自身的业务代码冲突。

## API

### `config(options)`

这里的配置项都是为了不与业务代码冲突所设置的，所以如非必要请不要调用。

下面是 `options` 的默认值：

```js
options = {
    animationName: 'resizeAnimation', // 关键帧动画名
    className: 'resize-trigger'       // div 样式名
}
```

### `addResizeListener(element, callback)`

添加事件回调，可以多次调用绑定多个事件处理函数。

### `removeResizeListener(element, callback)`

移除元素上指定的元素大小改变的回调函数。

