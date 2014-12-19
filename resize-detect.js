define(function (require, exports, module) {
    'use strict';

    // Element Resize Detection
    // ------------------------
    // Thanks to:
    //  - https://github.com/sdecima/javascript-detect-element-resize

    var attachEvent = document.attachEvent;
    var animationName = 'resizeAnimation';

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


    var stylesCreated = false;

    function createStyles() {
        if (!stylesCreated) {
            var animationKeyFrames = '@' + keyFramePrefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
            var animationStyle = keyFramePrefix + 'animation: 1ms ' + animationName + '; ';

            var css = (animationKeyFrames ? animationKeyFrames : '') +
                '.resize-triggers { ' + (animationStyle ? animationStyle : '') + 'visibility: hidden; opacity: 0; } ' +
                '.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; }' +
                '.resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }';

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
        var triggers = element.__resizeTriggers__,
            expand = triggers.firstElementChild,
            contract = triggers.lastElementChild,
            expandChild = expand.firstElementChild;
        contract.scrollLeft = contract.scrollWidth;
        contract.scrollTop = contract.scrollHeight;
        expandChild.style.width = expand.offsetWidth + 1 + 'px';
        expandChild.style.height = expand.offsetHeight + 1 + 'px';
        expand.scrollLeft = expand.scrollWidth;
        expand.scrollTop = expand.scrollHeight;
    }

    function checkSize(element) {
        return element.offsetWidth != element.__resizeLast__.width ||
            element.offsetHeight != element.__resizeLast__.height;
    }

    function scrollListener(e) {
        var element = this;
        resetTriggers(this);
        if (this.__resizeRAF__) {
            cancelFrame(this.__resizeRAF__);
        }
        this.__resizeRAF__ = requestFrame(function () {
            if (checkSize(element)) {
                element.__resizeLast__.width = element.offsetWidth;
                element.__resizeLast__.height = element.offsetHeight;
                element.__resizeListeners__.forEach(function (fn) {
                    fn.call(element, e);
                });
            }
        });
    }


    exports.addResizeListener = function (element, fn) {
        if (attachEvent) {
            element.attachEvent('onresize', fn);
        } else {
            if (!element.__resizeTriggers__) {
                if (getComputedStyle(element).position == 'static') {
                    element.style.position = 'relative';
                }
                createStyles();
                element.__resizeLast__ = {};
                element.__resizeListeners__ = [];
                (element.__resizeTriggers__ = document.createElement('div')).className = 'resize-triggers';
                element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' +
                    '<div class="contract-trigger"></div>';
                element.appendChild(element.__resizeTriggers__);
                resetTriggers(element);
                element.addEventListener('scroll', scrollListener, true);

                /* Listen for a css animation to detect element display/re-attach */
                animationStartEvent && element.__resizeTriggers__.addEventListener(animationStartEvent, function (e) {
                    if (e.animationName == animationName)
                        resetTriggers(element);
                });
            }
            element.__resizeListeners__.push(fn);
        }
    };

    exports.removeResizeListener = function (element, fn) {
        if (attachEvent) {
            element.detachEvent('onresize', fn);
        } else {
            element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
            if (!element.__resizeListeners__.length) {
                element.removeEventListener('scroll', scrollListener);
                element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
            }
        }
    }
});