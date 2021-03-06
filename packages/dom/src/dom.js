const SPECIAL_CHARS_REGEXP = /([:\-_]+(.))/g;
const MOZ_HACK_REGEXP = /^moz([A-Z])/;
const ieVersion = Number(document.documentMode);

/*说明：获取浏览器前缀 */
/*实现：判断某个元素的 css 样式是否存在 transition 属性 */
/*参数：dom 元素 */
/*返回值：boolean, 有则返回浏览器样式前缀，否则返回 false */
const _prefix = (function(temp) {
  var aPrefix = ['webkit', 'Moz', 'o', 'ms'],
    props = '';
  for (var i in aPrefix) {
    props = aPrefix[i] + 'Transition';
    if (temp.style[props] !== undefined) {
      return '-' + aPrefix[i].toLowerCase() + '-';
    }
  }
  return false;
})(document.createElement('wepg'));

/*去除空格 */
const trim = function(string) {
  return (string || '').replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, '');
};

/*转换为驼峰标识 */
const camelCase = function(name) {
  return name.replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter;
  }).replace(MOZ_HACK_REGEXP, 'Moz$1');
};

/*绑定事件 */
const on = (function() {
  if (document.addEventListener) {
    return function(element, event, handler) {
      if (element && event && handler) {
        element.addEventListener(event, handler, false);
      }
    };
  } else {
    return function(element, event, handler) {
      if (element && event && handler) {
        element.attachEvent('on' + event, handler);
      }
    };
  }
})();

/*移除事件监听 */
const off = (function() {
  if (document.removeEventListener) {
    return function(element, event, handler) {
      if (element && event) {
        element.removeEventListener(event, handler, false);
      }
    };
  } else {
    return function(element, event, handler) {
      if (element && event) {
        element.detachEvent('on' + event, handler);
      }
    };
  }
})();

/*一次就好 */
const once = function(el, event, fn) {
  var listener = function() {
    if (fn) {
      fn.apply(this, arguments);
    }
    off(el, event, listener);
  };
  on(el, event, listener);
};

/*获取样式属性值 */
const getStyle = ieVersion < 9 ? function(element, styleName) {
  if (!element || !styleName) return null;
  styleName = camelCase(styleName);
  if (styleName === 'float') {
    styleName = 'styleFloat';
  }
  try {
    switch(styleName) {
    case 'opacity':
      try {
        return element.filters.item('alpha').opacity / 100;
      } catch (e) {
        return 1.0;
      }
    default:
      return (element.style[styleName] || element.currentStyle ? element.currentStyle[styleName] : null);
    }
  } catch (e) {
    return element.style[styleName];
  }
} : function(element, styleName) {
  if (!element || !styleName) return null;
  styleName = camelCase(styleName);
  if (styleName === 'float') {
    styleName = 'cssFloat';
  }
  try {
    var computed = document.defaultView.getComputedStyle(element, '');
    return element.style[styleName] || computed ? computed[styleName] : null;
  } catch (e) {
    return element.style[styleName];
  }
};

/*设置样式 */
const setStyle = function(element, styleName, value) {
  if (!element || !styleName) return;

  if (typeof styleName === 'object') {
    for (var prop in styleName) {
      if (styleName.hasOwnProperty(prop)) {
        setStyle(element, prop, styleName[prop]);
      }
    }
  } else {
    styleName = camelCase(styleName);
    if (styleName === 'opacity' && ieVersion < 9) {
      element.style.filter = isNaN(value) ? '' : 'alpha(opacity=' + value * 100 + ')';
    } else {
      element.style[styleName] = value;
    }
  }
};

/*是否包含 class */
const hasClass = function(el, cls) {
  if (!el || !cls) return false;
  if (cls.indexOf(' ') !== -1) throw new Error('className should not contain space.');
  if (el.classList) {
    return el.classList.contains(cls);
  } else {
    return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }
};

/*添加 class */
const addClass = function(el, cls) {
  if (!el) return;
  var curClass = el.className;
  var classes = (cls || '').split(' ');

  for (var i = 0, len = classes.length; i < len; i++) {
    var clsName = classes[i];
    if (!clsName) continue;

    if (el.classList) { // IE9+
      el.classList.add(clsName);
    } else {
      if (!hasClass(el, clsName)) {
        curClass += ' ' + clsName;
      }
    }
  }
  if (!el.classList) {
    el.className = curClass;
  }
};

const addAllClass = function(els, cls) {
  if (!(els && els.length) || !cls) return;
  els.forEach(el => removeClass(el, cls));
};

/*移除 class */
const removeClass = function(el, cls) {
  if (!el || !cls) return;
  var classes = cls.split(' ');
  var curClass = ' ' + el.className + ' ';

  for (var i = 0, len = classes.length; i < len; i++) {
    var clsName = classes[i];
    if (!clsName) return;

    if (el.classList) {
      el.classList.remove(clsName);
    } else {
      if (hasClass(el, clsName)) {
        curClass = curClass.replace(' ' + clsName + ' ', ' ');
      }
    }
  }
  if (!el.classList) {
    el.className = trim(curClass);
  }
};

const removeAllClass = function(els, cls) {
  if (!(els && els.length) || !cls) return;
  els.forEach(el => removeClass(el, cls));
};

/*获取 left 和 top 距离 */
const getOffset = function(el) {
  var box = el.getBoundingClientRect();

  return {
    top: box.top + window.pageYOffset - document.documentElement.clientTop,
    left: box.left + window.pageXOffset - document.documentElement.clientLeft
  };
};

/**
 * fadeIn:
 *   displayMode: block inline-block inline
 */

const setOpacity = function (el, val) {
  el.filters ?
    el.style.filter = `alpha(opacity=${val})` :
    el.style.opacity = val / 100;
};

const fadeIn = function (el, speed = 20, opacity = 100, callback) {
  if (el.style.display === 'block' || el.style.opacity === 1) return;

  el.style.display = 'block';
  setOpacity(el, 0);

  let val = 0;

  (function fade() {
    if (!((val += 10) > opacity)) {
      setOpacity(el, val);

      if (window.requestAnimationFrame) {
        requestAnimationFrame(fade);
      } else {
        setTimeout(fade, speed);
      }
    } else if (typeof callback === 'function') {
      callback();
    }
  })();
};

/* fadeOut */
const fadeOut = function (el, speed = 20, opacity = 0) {
  if (el.style.display === 'none' || el.style.opacity === 0) return;

  setOpacity(el, 1);

  let val = 100;

  (function fade() {
    if ((val -= 10) < opacity) {
      el.style.display = 'none';
    } else {
      setOpacity(el, val);

      if (window.requestAnimationFrame) {
        requestAnimationFrame(fade);
      } else {
        setTimeout(fade, speed);
      }
    }
  })();
};


export {
  _prefix,
  trim,
  camelCase,
  on as domOn,
  off as domOff,
  once as domOnce,
  getStyle,
  setStyle,
  hasClass,
  addClass,
  addAllClass,
  removeClass,
  removeAllClass,
  getOffset,
  fadeIn,
  fadeOut
};
