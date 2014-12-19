define(function (require, exports, module) {
    'use strict';

    // Element Resize Detection
    // ------------------------
    // Thanks to:
    //  - https://github.com/sdecima/javascript-detect-element-resize

    var attachEvent = document.attachEvent;

    if (!attachEvent) {

        var requestFrame = (function () {
            var raf = window.requestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                function (fn) {
                    return window.setTimeout(fn, 20);
                };

            return function (fn) {
                return raf(fn);
            };

        })();

        var cancelFrame = (function () {
            var cancel = window.cancelAnimationFrame ||
                window.mozCancelAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.clearTimeout;

            return function (id) {
                return cancel(id);
            };

        })();

        // 检测浏览器对 css3 动画的支持情况
        var animation = false;
        var animationString = 'animation';
        var animationStartEvent = 'animationstart';
        var keyFramePrefix = '';

        // 浏览器前缀
        var domPrefixes = 'Webkit Moz O ms'.split(' ');
        var startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' ');
        var pfx = '';

        var fakeElement = document.createElement('fake');
        if (fakeElement.style.animationName !== undefined) {
            animation = true;
        }

        if (animation === false) {
            for (var i = 0; i < domPrefixes.length; i++) {
                if (fakeElement.style[ domPrefixes[i] + 'AnimationName' ] !== undefined) {
                    pfx = domPrefixes[ i ];
                    animationString = pfx + 'Animation';
                    keyFramePrefix = '-' + pfx.toLowerCase() + '-';
                    animationStartEvent = startEvents[ i ];
                    animation = true;
                    break;
                }
            }
        }
    }

    // 关键帧动画名
    var animationName = 'resizeAnimation';
    // trigger 样式名
    var className = 'resize-trigger';
    var stylesCreated = false;

    function createStyles() {
        if (!stylesCreated) {
            var animationKeyFrames = '@' + keyFramePrefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
            var animationStyle = keyFramePrefix + 'animation: 1ms ' + animationName + '; ';

            var css = animationKeyFrames ? animationKeyFrames : '';

            css += '.' + className + ' { ' + (animationStyle ? animationStyle : '') + 'visibility: hidden; opacity: 0; } ';
            css +=
                '.' + className + ', ' +
                '.' + className + ' > div, ' +
                '.' + className + '-contract:before ' +
                '{ content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; }';

            css += '.' + className + ' > div { background: #eee; overflow: auto; } ';
            css += '.' + className + '-contract:before { width: 200%; height: 200%; }';

            var head = document.head || document.getElementsByTagName('head')[0];
            var style = document.createElement('style');

            style.type = 'text/css';
            if (style.styleSheet) {
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            head.appendChild(style);
            stylesCreated = true;
        }
    }

    function resetTriggers(element) {
        var triggers = element.__resize__.trigger;
        var expand = triggers.firstElementChild;
        var contract = triggers.lastElementChild;
        var expandChild = expand.firstElementChild;

        contract.scrollLeft = contract.scrollWidth;
        contract.scrollTop = contract.scrollHeight;
        expand.scrollLeft = expand.scrollWidth;
        expand.scrollTop = expand.scrollHeight;
        expandChild.style.width = expand.offsetWidth + 1 + 'px';
        expandChild.style.height = expand.offsetHeight + 1 + 'px';
    }

    function checkSize(element) {
        var size = element.__resize__.size || {};
        return element.offsetWidth != size.width ||
            element.offsetHeight != size.height;
    }

    function scrollListener(e) {
        var element = this;
        var settings = element.__resize__;
        resetTriggers(element);
        if (settings.raf) {
            cancelFrame(settings.raf);
        }
        settings.raf = requestFrame(function () {
            if (checkSize(element)) {
                settings.size.width = element.offsetWidth;
                settings.size.height = element.offsetHeight;
                settings.handlers.forEach(function (fn) {
                    fn.call(element, e);
                });
            }
        });
    }

    // 提供 config 接口，避免关键帧动画名和 css 类名冲突
    // 在绑定事件之前调用该方法
    exports.config = function (options) {
        animationName = options.animationName || animationName;
        className = options.className || className;
    };

    exports.addResizeListener = function (element, callback) {
        if (attachEvent) {
            element.attachEvent('onresize', callback);
        } else {
            var settings = element.__resize__;
            settings || (settings = element.__resize__ = {});
            var trigger = settings.trigger;

            if (!trigger) {
                if (getComputedStyle(element).position == 'static') {
                    element.style.position = 'relative';
                }
                createStyles();
                settings.handlers = [];
                settings.size = {};

                // init trigger
                trigger = document.createElement('div');
                trigger.className = className;
                trigger.innerHTML = '' +
                    '<div class="' + className + '-expand"><div></div></div>' +
                    '<div class="' + className + '-contract"></div>';
                settings.trigger = trigger;

                element.appendChild(trigger);
                resetTriggers(element);
                element.addEventListener('scroll', scrollListener, true);

                /* Listen for a css animation to detect element display/re-attach */
                animationStartEvent && trigger.addEventListener(animationStartEvent, function (e) {
                    if (e.animationName == animationName)
                        resetTriggers(element);
                });
            }
            settings.handlers.push(callback);
        }
    };

    exports.removeResizeListener = function (element, callback) {
        if (attachEvent) {
            element.detachEvent('onresize', callback);
        } else {
            var settings = element.__resize__;
            var handlers = settings.handlers;
            if (handlers) {
                handlers.splice(handlers.indexOf(callback), 1);
            }
            if (!handlers.length) {
                element.removeEventListener('scroll', scrollListener);
                settings.trigger = !element.removeChild(settings.trigger);
            }
        }
    };

});