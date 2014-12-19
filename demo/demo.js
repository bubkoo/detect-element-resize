define(function (require, exports, module) {
    'use strict';

    var resizeDetect = require('../resize-detect');

    resizeDetect.config({
        animationName: 'resizeTest',      // default is 'resizeAnimation'
        className: 'resize-test-trigger'  // default is 'resize-trigger'
    });

    resizeDetect.addResizeListener(document.getElementById('tester'), function () {
        console.log('size changed.');
    });

    document.getElementById('font_up').addEventListener('click', function () {
        tester.style.height = Number(getComputedStyle(tester).height.replace('px', '')) + 40 + 'px';
    }, false);

    document.getElementById('font_down').addEventListener('click', function () {
        tester.style.height = Number(getComputedStyle(tester).height.replace('px', '')) - 40 + 'px';
    }, false);
});