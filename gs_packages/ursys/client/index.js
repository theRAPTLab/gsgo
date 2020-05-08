(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index-client.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../../node_modules/process/browser.js":
/*!********************************************************************************!*\
  !*** /Users/sri/Dev/INQ/stepsys/gem-step/gsgo/node_modules/process/browser.js ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ "./node_modules/hashids/cjs/index.js":
/*!*******************************************!*\
  !*** ./node_modules/hashids/cjs/index.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ../dist/hashids.js */ "./node_modules/hashids/dist/hashids.js").default


/***/ }),

/***/ "./node_modules/hashids/dist/hashids.js":
/*!**********************************************!*\
  !*** ./node_modules/hashids/dist/hashids.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [exports], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else { var mod; }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports) {
  "use strict";

  _exports.__esModule = true;
  _exports.onlyChars = _exports.withoutChars = _exports.keepUnique = _exports.default = void 0;

  function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

  function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

  function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

  function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

  var Hashids =
  /*#__PURE__*/
  function () {
    function Hashids(salt, minLength, alphabet, seps) {
      if (salt === void 0) {
        salt = '';
      }

      if (minLength === void 0) {
        minLength = 0;
      }

      if (alphabet === void 0) {
        alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
      }

      if (seps === void 0) {
        seps = 'cfhistuCFHISTU';
      }

      this.minLength = minLength;

      if (typeof minLength !== 'number') {
        throw new TypeError("Hashids: Provided 'minLength' has to be a number (is " + typeof minLength + ")");
      }

      if (typeof salt !== 'string') {
        throw new TypeError("Hashids: Provided 'salt' has to be a string (is " + typeof salt + ")");
      }

      if (typeof alphabet !== 'string') {
        throw new TypeError("Hashids: Provided alphabet has to be a string (is " + typeof alphabet + ")");
      }

      var saltChars = Array.from(salt);
      var alphabetChars = Array.from(alphabet);
      var sepsChars = Array.from(seps);
      this.salt = saltChars;
      var uniqueAlphabet = keepUnique(alphabetChars);

      if (uniqueAlphabet.length < minAlphabetLength) {
        throw new Error("Hashids: alphabet must contain at least " + minAlphabetLength + " unique characters, provided: " + uniqueAlphabet);
      }
      /** `alphabet` should not contains `seps` */


      this.alphabet = withoutChars(uniqueAlphabet, sepsChars);
      /** `seps` should contain only characters present in `alphabet` */

      var filteredSeps = onlyChars(sepsChars, uniqueAlphabet);
      this.seps = shuffle(filteredSeps, saltChars);
      var sepsLength;
      var diff;

      if (this.seps.length === 0 || this.alphabet.length / this.seps.length > sepDiv) {
        sepsLength = Math.ceil(this.alphabet.length / sepDiv);

        if (sepsLength > this.seps.length) {
          var _this$seps;

          diff = sepsLength - this.seps.length;

          (_this$seps = this.seps).push.apply(_this$seps, _toConsumableArray(this.alphabet.slice(0, diff)));

          this.alphabet = this.alphabet.slice(diff);
        }
      }

      this.alphabet = shuffle(this.alphabet, saltChars);
      var guardCount = Math.ceil(this.alphabet.length / guardDiv);

      if (this.alphabet.length < 3) {
        this.guards = this.seps.slice(0, guardCount);
        this.seps = this.seps.slice(guardCount);
      } else {
        this.guards = this.alphabet.slice(0, guardCount);
        this.alphabet = this.alphabet.slice(guardCount);
      }

      this.guardsRegExp = makeAnyOfCharsRegExp(this.guards);
      this.sepsRegExp = makeAnyOfCharsRegExp(this.seps);
      this.allowedCharsRegExp = makeAtLeastSomeCharRegExp([].concat(_toConsumableArray(this.alphabet), _toConsumableArray(this.guards), _toConsumableArray(this.seps)));
    }

    var _proto = Hashids.prototype;

    _proto.encode = function encode(first) {
      for (var _len = arguments.length, numbers = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        numbers[_key - 1] = arguments[_key];
      }

      var ret = '';

      if (Array.isArray(first)) {
        numbers = first;
      } else {
        // eslint-disable-next-line eqeqeq
        numbers = [].concat(_toConsumableArray(first != null ? [first] : []), _toConsumableArray(numbers));
      }

      if (!numbers.length) {
        return ret;
      }

      if (!numbers.every(isIntegerNumber)) {
        numbers = numbers.map(function (n) {
          return typeof n === 'bigint' || typeof n === 'number' ? n : safeParseInt10(String(n));
        });
      }

      if (!numbers.every(isPositiveAndFinite)) {
        return ret;
      }

      return this._encode(numbers).join('');
    };

    _proto.decode = function decode(id) {
      if (!id || typeof id !== 'string' || id.length === 0) return [];
      return this._decode(id);
    }
    /**
     * @description Splits a hex string into groups of 12-digit hexadecimal numbers,
     * then prefixes each with '1' and encodes the resulting array of numbers
     *
     * Encoding '00000000000f00000000000f000f' would be the equivalent of:
     * Hashids.encode([0x100000000000f, 0x100000000000f, 0x1000f])
     *
     * This means that if your environment supports BigInts,
     * you will get different (shorter) results if you provide
     * a BigInt representation of your hex and use `encode` directly, e.g.:
     * Hashids.encode(BigInt(`0x${hex}`))
     *
     * To decode such a representation back to a hex string, use the following snippet:
     * Hashids.decode(id)[0].toString(16)
     */
    ;

    _proto.encodeHex = function encodeHex(hex) {
      switch (typeof hex) {
        case 'bigint':
          hex = hex.toString(16);
          break;

        case 'string':
          if (!/^[0-9a-fA-F]+$/.test(hex)) return '';
          break;

        default:
          throw new Error("Hashids: The provided value is neither a string, nor a BigInt (got: " + typeof hex + ")");
      }

      var numbers = splitAtIntervalAndMap(hex, 12, function (part) {
        return parseInt("1" + part, 16);
      });
      return this.encode(numbers);
    };

    _proto.decodeHex = function decodeHex(id) {
      return this.decode(id).map(function (number) {
        return number.toString(16).slice(1);
      }).join('');
    };

    _proto._encode = function _encode(numbers) {
      var _this = this;

      var alphabet = this.alphabet;
      var numbersIdInt = numbers.reduce(function (last, number, i) {
        return last + (typeof number === 'bigint' ? Number(number % BigInt(i + 100)) : number % (i + 100));
      }, 0);
      var ret = [alphabet[numbersIdInt % alphabet.length]];
      var lottery = ret.slice();
      var seps = this.seps;
      var guards = this.guards;
      numbers.forEach(function (number, i) {
        var _ret;

        var buffer = lottery.concat(_this.salt, alphabet);
        alphabet = shuffle(alphabet, buffer);
        var last = toAlphabet(number, alphabet);

        (_ret = ret).push.apply(_ret, _toConsumableArray(last));

        if (i + 1 < numbers.length) {
          var charCode = last[0].codePointAt(0) + i;
          var extraNumber = typeof number === 'bigint' ? Number(number % BigInt(charCode)) : number % charCode;
          ret.push(seps[extraNumber % seps.length]);
        }
      });

      if (ret.length < this.minLength) {
        var prefixGuardIndex = (numbersIdInt + ret[0].codePointAt(0)) % guards.length;
        ret.unshift(guards[prefixGuardIndex]);

        if (ret.length < this.minLength) {
          var suffixGuardIndex = (numbersIdInt + ret[2].codePointAt(0)) % guards.length;
          ret.push(guards[suffixGuardIndex]);
        }
      }

      var halfLength = Math.floor(alphabet.length / 2);

      while (ret.length < this.minLength) {
        var _ret2, _ret3;

        alphabet = shuffle(alphabet, alphabet);

        (_ret2 = ret).unshift.apply(_ret2, _toConsumableArray(alphabet.slice(halfLength)));

        (_ret3 = ret).push.apply(_ret3, _toConsumableArray(alphabet.slice(0, halfLength)));

        var excess = ret.length - this.minLength;

        if (excess > 0) {
          var halfOfExcess = excess / 2;
          ret = ret.slice(halfOfExcess, halfOfExcess + this.minLength);
        }
      }

      return ret;
    };

    _proto.isValidId = function isValidId(id) {
      return this.allowedCharsRegExp.test(id);
    };

    _proto._decode = function _decode(id) {
      if (!this.isValidId(id)) {
        throw new Error("The provided ID (" + id + ") is invalid, as it contains characters that do not exist in the alphabet (" + this.guards.join('') + this.seps.join('') + this.alphabet.join('') + ")");
      }

      var idGuardsArray = id.split(this.guardsRegExp);
      var splitIndex = idGuardsArray.length === 3 || idGuardsArray.length === 2 ? 1 : 0;
      var idBreakdown = idGuardsArray[splitIndex];
      if (idBreakdown.length === 0) return [];
      var lotteryChar = idBreakdown[Symbol.iterator]().next().value;
      var idArray = idBreakdown.slice(lotteryChar.length).split(this.sepsRegExp);
      var lastAlphabet = this.alphabet;
      var result = [];

      for (var _iterator = idArray, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var subId = _ref;
        var buffer = [lotteryChar].concat(_toConsumableArray(this.salt), _toConsumableArray(lastAlphabet));
        var nextAlphabet = shuffle(lastAlphabet, buffer.slice(0, lastAlphabet.length));
        result.push(fromAlphabet(Array.from(subId), nextAlphabet));
        lastAlphabet = nextAlphabet;
      } // if the result is different from what we'd expect, we return an empty result (malformed input):


      if (this._encode(result).join('') !== id) return [];
      return result;
    };

    return Hashids;
  }();

  _exports.default = Hashids;
  var minAlphabetLength = 16;
  var sepDiv = 3.5;
  var guardDiv = 12;

  var keepUnique = function keepUnique(content) {
    return Array.from(new Set(content));
  };

  _exports.keepUnique = keepUnique;

  var withoutChars = function withoutChars(chars, _withoutChars) {
    return chars.filter(function (char) {
      return !_withoutChars.includes(char);
    });
  };

  _exports.withoutChars = withoutChars;

  var onlyChars = function onlyChars(chars, keepChars) {
    return chars.filter(function (char) {
      return keepChars.includes(char);
    });
  };

  _exports.onlyChars = onlyChars;

  var isIntegerNumber = function isIntegerNumber(n) {
    return typeof n === 'bigint' || !Number.isNaN(Number(n)) && Math.floor(Number(n)) === n;
  };

  var isPositiveAndFinite = function isPositiveAndFinite(n) {
    return typeof n === 'bigint' || n >= 0 && Number.isSafeInteger(n);
  };

  function shuffle(alphabetChars, saltChars) {
    if (saltChars.length === 0) {
      return alphabetChars;
    }

    var integer;
    var transformed = alphabetChars.slice();

    for (var i = transformed.length - 1, v = 0, p = 0; i > 0; i--, v++) {
      v %= saltChars.length;
      p += integer = saltChars[v].codePointAt(0);
      var j = (integer + v + p) % i; // swap characters at positions i and j

      var a = transformed[i];
      var b = transformed[j];
      transformed[j] = a;
      transformed[i] = b;
    }

    return transformed;
  }

  var toAlphabet = function toAlphabet(input, alphabetChars) {
    var id = [];

    if (typeof input === 'bigint') {
      var alphabetLength = BigInt(alphabetChars.length);

      do {
        id.unshift(alphabetChars[Number(input % alphabetLength)]);
        input = input / alphabetLength;
      } while (input > BigInt(0));
    } else {
      do {
        id.unshift(alphabetChars[input % alphabetChars.length]);
        input = Math.floor(input / alphabetChars.length);
      } while (input > 0);
    }

    return id;
  };

  var fromAlphabet = function fromAlphabet(inputChars, alphabetChars) {
    return inputChars.reduce(function (carry, item) {
      var index = alphabetChars.indexOf(item);

      if (index === -1) {
        throw new Error("The provided ID (" + inputChars.join('') + ") is invalid, as it contains characters that do not exist in the alphabet (" + alphabetChars.join('') + ")");
      }

      if (typeof carry === 'bigint') {
        return carry * BigInt(alphabetChars.length) + BigInt(index);
      }

      var value = carry * alphabetChars.length + index;
      var isSafeValue = Number.isSafeInteger(value);

      if (isSafeValue) {
        return value;
      } else {
        if (typeof BigInt === 'function') {
          return BigInt(carry) * BigInt(alphabetChars.length) + BigInt(index);
        } else {
          // we do not have support for BigInt:
          throw new Error("Unable to decode the provided string, due to lack of support for BigInt numbers in the current environment");
        }
      }
    }, 0);
  };

  var safeToParseNumberRegExp = /^\+?[0-9]+$/;

  var safeParseInt10 = function safeParseInt10(str) {
    return safeToParseNumberRegExp.test(str) ? parseInt(str, 10) : NaN;
  };

  var splitAtIntervalAndMap = function splitAtIntervalAndMap(str, nth, map) {
    return Array.from({
      length: Math.ceil(str.length / nth)
    }, function (_, index) {
      return map(str.slice(index * nth, (index + 1) * nth));
    });
  };

  var makeAnyOfCharsRegExp = function makeAnyOfCharsRegExp(chars) {
    return new RegExp(chars.map(function (char) {
      return escapeRegExp(char);
    }) // we need to sort these from longest to shortest,
    // as they may contain multibyte unicode characters (these should come first)
    .sort(function (a, b) {
      return b.length - a.length;
    }).join('|'));
  };

  var makeAtLeastSomeCharRegExp = function makeAtLeastSomeCharRegExp(chars) {
    return new RegExp("^[" + chars.map(function (char) {
      return escapeRegExp(char);
    }) // we need to sort these from longest to shortest,
    // as they may contain multibyte unicode characters (these should come first)
    .sort(function (a, b) {
      return b.length - a.length;
    }).join('') + "]+$");
  };

  var escapeRegExp = function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  };
});

//# sourceMappingURL=hashids.js.map

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/bytesToUuid.js":
/*!***********************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/bytesToUuid.js ***!
  \***********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];

for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex; // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4

  return [bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]]].join('');
}

/* harmony default export */ __webpack_exports__["default"] = (bytesToUuid);

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/index.js ***!
  \*****************************************************/
/*! exports provided: v1, v3, v4, v5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _v1_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./v1.js */ "./node_modules/uuid/dist/esm-browser/v1.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "v1", function() { return _v1_js__WEBPACK_IMPORTED_MODULE_0__["default"]; });

/* harmony import */ var _v3_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./v3.js */ "./node_modules/uuid/dist/esm-browser/v3.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "v3", function() { return _v3_js__WEBPACK_IMPORTED_MODULE_1__["default"]; });

/* harmony import */ var _v4_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./v4.js */ "./node_modules/uuid/dist/esm-browser/v4.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "v4", function() { return _v4_js__WEBPACK_IMPORTED_MODULE_2__["default"]; });

/* harmony import */ var _v5_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./v5.js */ "./node_modules/uuid/dist/esm-browser/v5.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "v5", function() { return _v5_js__WEBPACK_IMPORTED_MODULE_3__["default"]; });






/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/md5.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/md5.js ***!
  \***************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/*
 * Browser-compatible JavaScript MD5
 *
 * Modification of JavaScript MD5
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
function md5(bytes) {
  if (typeof bytes == 'string') {
    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = new Array(msg.length);

    for (var i = 0; i < msg.length; i++) {
      bytes[i] = msg.charCodeAt(i);
    }
  }

  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
}
/*
 * Convert an array of little-endian words to an array of bytes
 */


function md5ToHexEncodedArray(input) {
  var i;
  var x;
  var output = [];
  var length32 = input.length * 32;
  var hexTab = '0123456789abcdef';
  var hex;

  for (i = 0; i < length32; i += 8) {
    x = input[i >> 5] >>> i % 32 & 0xff;
    hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
    output.push(hex);
  }

  return output;
}
/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */


function wordsToMd5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << len % 32;
  x[(len + 64 >>> 9 << 4) + 14] = len;
  var i;
  var olda;
  var oldb;
  var oldc;
  var oldd;
  var a = 1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d = 271733878;

  for (i = 0; i < x.length; i += 16) {
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  return [a, b, c, d];
}
/*
 * Convert an array bytes to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */


function bytesToWords(input) {
  var i;
  var output = [];
  output[(input.length >> 2) - 1] = undefined;

  for (i = 0; i < output.length; i += 1) {
    output[i] = 0;
  }

  var length8 = input.length * 8;

  for (i = 0; i < length8; i += 8) {
    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
  }

  return output;
}
/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */


function safeAdd(x, y) {
  var lsw = (x & 0xffff) + (y & 0xffff);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return msw << 16 | lsw & 0xffff;
}
/*
 * Bitwise rotate a 32-bit number to the left.
 */


function bitRotateLeft(num, cnt) {
  return num << cnt | num >>> 32 - cnt;
}
/*
 * These functions implement the four basic operations the algorithm uses.
 */


function md5cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a, b, c, d, x, s, t) {
  return md5cmn(b & c | ~b & d, a, b, x, s, t);
}

function md5gg(a, b, c, d, x, s, t) {
  return md5cmn(b & d | c & ~d, a, b, x, s, t);
}

function md5hh(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

/* harmony default export */ __webpack_exports__["default"] = (md5);

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/rng.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/rng.js ***!
  \***************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return rng; });
// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
// getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
// find the complete implementation of crypto (msCrypto) on IE11.
var getRandomValues = typeof crypto != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto != 'undefined' && typeof msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto);
var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

function rng() {
  if (!getRandomValues) {
    throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
  }

  return getRandomValues(rnds8);
}

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/sha1.js":
/*!****************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/sha1.js ***!
  \****************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
// Adapted from Chris Veness' SHA1 code at
// http://www.movable-type.co.uk/scripts/sha1.html
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;

    case 1:
      return x ^ y ^ z;

    case 2:
      return x & y ^ x & z ^ y & z;

    case 3:
      return x ^ y ^ z;
  }
}

function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}

function sha1(bytes) {
  var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  var H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  if (typeof bytes == 'string') {
    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = new Array(msg.length);

    for (var i = 0; i < msg.length; i++) {
      bytes[i] = msg.charCodeAt(i);
    }
  }

  bytes.push(0x80);
  var l = bytes.length / 4 + 2;
  var N = Math.ceil(l / 16);
  var M = new Array(N);

  for (var i = 0; i < N; i++) {
    M[i] = new Array(16);

    for (var j = 0; j < 16; j++) {
      M[i][j] = bytes[i * 64 + j * 4] << 24 | bytes[i * 64 + j * 4 + 1] << 16 | bytes[i * 64 + j * 4 + 2] << 8 | bytes[i * 64 + j * 4 + 3];
    }
  }

  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

  for (var i = 0; i < N; i++) {
    var W = new Array(80);

    for (var t = 0; t < 16; t++) {
      W[t] = M[i][t];
    }

    for (var t = 16; t < 80; t++) {
      W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    var a = H[0];
    var b = H[1];
    var c = H[2];
    var d = H[3];
    var e = H[4];

    for (var t = 0; t < 80; t++) {
      var s = Math.floor(t / 20);
      var T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }

    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }

  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
}

/* harmony default export */ __webpack_exports__["default"] = (sha1);

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/v1.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/v1.js ***!
  \**************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _rng_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./rng.js */ "./node_modules/uuid/dist/esm-browser/rng.js");
/* harmony import */ var _bytesToUuid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./bytesToUuid.js */ "./node_modules/uuid/dist/esm-browser/bytesToUuid.js");

 // **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;

var _clockseq; // Previous uuid creation time


var _lastMSecs = 0;
var _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];
  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189

  if (node == null || clockseq == null) {
    var seedBytes = options.random || (options.rng || _rng_js__WEBPACK_IMPORTED_MODULE_0__["default"])();

    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }

    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime(); // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock

  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

  var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval


  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  } // Per 4.2.1.2 Throw error if too many uuids are requested


  if (nsecs >= 10000) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

  msecs += 12219292800000; // `time_low`

  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff; // `time_mid`

  var tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff; // `time_high_and_version`

  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

  b[i++] = clockseq & 0xff; // `node`

  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : Object(_bytesToUuid_js__WEBPACK_IMPORTED_MODULE_1__["default"])(b);
}

/* harmony default export */ __webpack_exports__["default"] = (v1);

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/v3.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/v3.js ***!
  \**************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _v35_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./v35.js */ "./node_modules/uuid/dist/esm-browser/v35.js");
/* harmony import */ var _md5_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./md5.js */ "./node_modules/uuid/dist/esm-browser/md5.js");


var v3 = Object(_v35_js__WEBPACK_IMPORTED_MODULE_0__["default"])('v3', 0x30, _md5_js__WEBPACK_IMPORTED_MODULE_1__["default"]);
/* harmony default export */ __webpack_exports__["default"] = (v3);

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/v35.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/v35.js ***!
  \***************************************************/
/*! exports provided: DNS, URL, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DNS", function() { return DNS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "URL", function() { return URL; });
/* harmony import */ var _bytesToUuid_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./bytesToUuid.js */ "./node_modules/uuid/dist/esm-browser/bytesToUuid.js");


function uuidToBytes(uuid) {
  // Note: We assume we're being passed a valid uuid string
  var bytes = [];
  uuid.replace(/[a-fA-F0-9]{2}/g, function (hex) {
    bytes.push(parseInt(hex, 16));
  });
  return bytes;
}

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  var bytes = new Array(str.length);

  for (var i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }

  return bytes;
}

var DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
var URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
/* harmony default export */ __webpack_exports__["default"] = (function (name, version, hashfunc) {
  var generateUUID = function generateUUID(value, namespace, buf, offset) {
    var off = buf && offset || 0;
    if (typeof value == 'string') value = stringToBytes(value);
    if (typeof namespace == 'string') namespace = uuidToBytes(namespace);
    if (!Array.isArray(value)) throw TypeError('value must be an array of bytes');
    if (!Array.isArray(namespace) || namespace.length !== 16) throw TypeError('namespace must be uuid string or an Array of 16 byte values'); // Per 4.3

    var bytes = hashfunc(namespace.concat(value));
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      for (var idx = 0; idx < 16; ++idx) {
        buf[off + idx] = bytes[idx];
      }
    }

    return buf || Object(_bytesToUuid_js__WEBPACK_IMPORTED_MODULE_0__["default"])(bytes);
  }; // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name;
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL;
  return generateUUID;
});

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/v4.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/v4.js ***!
  \**************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _rng_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./rng.js */ "./node_modules/uuid/dist/esm-browser/rng.js");
/* harmony import */ var _bytesToUuid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./bytesToUuid.js */ "./node_modules/uuid/dist/esm-browser/bytesToUuid.js");



function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof options == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }

  options = options || {};
  var rnds = options.random || (options.rng || _rng_js__WEBPACK_IMPORTED_MODULE_0__["default"])(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || Object(_bytesToUuid_js__WEBPACK_IMPORTED_MODULE_1__["default"])(rnds);
}

/* harmony default export */ __webpack_exports__["default"] = (v4);

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/v5.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/v5.js ***!
  \**************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _v35_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./v35.js */ "./node_modules/uuid/dist/esm-browser/v35.js");
/* harmony import */ var _sha1_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./sha1.js */ "./node_modules/uuid/dist/esm-browser/sha1.js");


var v5 = Object(_v35_js__WEBPACK_IMPORTED_MODULE_0__["default"])('v5', 0x50, _sha1_js__WEBPACK_IMPORTED_MODULE_1__["default"]);
/* harmony default export */ __webpack_exports__["default"] = (v5);

/***/ }),

/***/ "./src/class-messager.js":
/*!*******************************!*\
  !*** ./src/class-messager.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* eslint-disable @typescript-eslint/no-use-before-define */

/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Messager - Handle a collection of named events and their handlers.
    https://en.wikipedia.org/wiki/Event-driven_architecture#JavaScript

    This is a low-level class used by other URSYS modules both by client
    browsers and nodejs.

    NOTE: CallerReturnFunctions receive data object AND control object.
    The control object has the "return" function that closes a transaction;
    this is useful for async operations without Promises.

    NOTE: When providing a handlerFunc, users should be aware of binding
    context using Function.prototype.bind() or by using arrow functions
\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/
// NOTE: This module uses the COMMONJS module format for compatibility
// between node and browser-side Javascript.
const NetMessage = __webpack_require__(/*! ./class-netmessage */ "./src/class-netmessage.js"); /// MODULE VARS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


let MSGR_IDCOUNT = 0;
let DBG = true; /// URSYS MESSAGER CLASS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Implement network-aware message passing scheme based on message strings passing
 * single data objects. Message table stores multiple message handlers as a set
 * to avoid multiple registered handlers
 */

class Messager {
  constructor() {
    this.handlerMap = new Map(); // message map storing sets of functions

    this.messager_id = ++MSGR_IDCOUNT;
  } /// FIRE ONCE EVENTS //////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Register a message string to a handler function that will receive a mutable
   * data object that is returned at the end of the handler function
   * @example Subscribe('MY_MESSAGE',(data)=>{ return data; });
   * @param {string} mesgName message to register a handler for
   * @param {function} handlerFunc function receiving 'data' object
   * @param {Object} [options] options
   * @param {string} [options.handlerUID] URSYS_ID identifies group, attaches handler
   * @param {string} [options.info] description of message handler
   * @param {Object} [options.syntax] dictionary of data object properties accepted
   */


  Subscribe(mesgName, handlerFunc, options = {}) {
    let {
      handlerUID
    } = options;
    let {
      syntax
    } = options;
    let {
      fromNet
    } = options;

    if (typeof handlerFunc !== 'function') {
      throw Error('arg2 must be a function');
    }

    if (typeof handlerUID === 'string') {
      // bind the ULINK uid to the handlerFunc function for convenient access
      // by the message dispatcher
      handlerFunc.ulink_id = handlerUID;
    }

    if (typeof fromNet === 'boolean') {
      // true if this subscriber wants to receive network messages
      handlerFunc.fromNet = fromNet;
    }

    let handlers = this.handlerMap.get(mesgName);

    if (!handlers) {
      handlers = new Set();
      this.handlerMap.set(mesgName, handlers);
    } // syntax annotation


    if (syntax) handlerFunc.umesg = {
      syntax
    }; // saved function to handler

    handlers.add(handlerFunc);
    return this;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Unsubscribe a handler function from a registered message. The handler
   * function object must be the same one used to register it.
   * @param {string} mesgName message to unregister a handler for
   * @param {function} handlerFunc function originally registered
   */


  Unsubscribe(mesgName, handlerFunc) {
    if (!arguments.length) {
      this.handlerMap.clear();
    } else if (arguments.length === 1) {
      this.handlerMap.delete(mesgName);
    } else {
      const handlers = this.handlerMap.get(mesgName);

      if (handlers) {
        handlers.delete(handlerFunc);
      }
    }

    return this;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Publish a message with data payload
   * @param {string} mesgName message to send data to
   * @param {Object} inData parameters for the message handler
   * @param {Object} [options] options
   * @param {string} [options.srcUID] URSYS_ID group that is sending the
   * message. If this is set, then the sending URSYS_ID can receive its own
   * message request.
   * @param {string} [options.type] type of message (mcall)
   * @param {boolean} [options.toLocal=true] send to local message handlers
   * @param {boolean} [options.toNet=false] send to network message handlers
   */


  Publish(mesgName, inData, options = {}) {
    let {
      srcUID,
      type
    } = options;
    let {
      toLocal = true,
      toNet = false
    } = options;
    const handlers = this.handlerMap.get(mesgName); /// toLocal

    if (handlers && toLocal) handlers.forEach(handlerFunc => {
      // handlerFunc signature: (data,dataReturn) => {}
      // handlerFunc has ulink_id property to note originating ULINK object
      // skip "same origin" calls
      if (srcUID && handlerFunc.ulink_id === srcUID) {
        console.warn(`MessagerSend: [${mesgName}] skip call since origin = destination; use Broadcast() if intended`);
        return;
      } // trigger the local handler (no return expected)


      handlerFunc(inData, {}); // second param is for control message expansion
    }); // end handlers.forEach
    /// toNetwork

    if (toNet) {
      let pkt = new NetMessage(mesgName, inData, type);
      pkt.SocketSend();
    } // end toNetwork

  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Publish message to everyone, local and network, and also mirrors back to self.
   * This is a wrapper for Publish() that ensures that srcUID is overridden.
   * @param {string} mesgName message to send data to
   * @param {Object} inData parameters for the message handler
   * @param {Object} [options] see Publish() for option details
   */


  Signal(mesgName, data, options = {}) {
    if (options.srcUID) {
      console.warn(`overriding srcUID ${options.srcUID} with NULL because Signal() doesn't use it`);
      options.srcUID = null;
    }

    this.Publish(mesgName, data, options);
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Issue a message transaction. Returns an array of promises. Works across
   * the network.
   * @param {string} mesgName message to send data to
   * @param {Object} inData parameters for the message handler
   * @param {Object} [options] see Publish() for option details
   * @returns {Array} an array of Promises
   */


  async CallAsync(mesgName, inData, options = {}) {
    let {
      srcUID,
      type
    } = options;
    let {
      toLocal = true,
      toNet = true
    } = options;
    let {
      fromNet = false
    } = options;
    const channel = NetMessage.ExtractChannel(mesgName);
    const handlers = this.handlerMap.get(mesgName);
    let promises = []; /// handle a call from the network

    if (toLocal) {
      if (!channel.LOCAL && !fromNet) throw Error(`'${mesgName}' for local calls remove channel prefix`);

      if (handlers) {
        handlers.forEach(handlerFunc => {
          /*/
          handlerFunc signature: (data,dataReturn) => {}
          handlerFunc has ulink_id property to note originating ULINK object
          handlerFunc has fromNet property if it expects to receive network sourced calls
          /*/
          // skip calls that don't have their fromNet stat set if it's a net call
          if (fromNet && !handlerFunc.fromNet) {
            if (DBG) console.warn(`MessagerCall: [${mesgName}] skip netcall for handler uninterested in net`);
            return;
          } // skip "same origin" calls


          if (srcUID && handlerFunc.ulink_id === srcUID) {
            if (DBG) console.warn(`MessagerCall: [${mesgName}] skip call since origin = destination; use Signal() if intended`);
            return;
          } // Create a promise. if handlerFunc returns a promise, it follows


          let p = f_MakeResolverFunction(handlerFunc, inData);
          promises.push(p);
        }); // end foreach
      } else {
        // no handlers
        promises.push(Promise.resolve({
          error: 'local message handler not found'
        }));
      }
    } // to local
    // end if handlers
    /// resolver function
    /// remember MESSAGER class is used for more than just Network Calls
    /// the state manager also uses it, so the resolved value may be of any type


    function f_MakeResolverFunction(handlerFunc) {
      return new Promise(resolve => {
        let retval = handlerFunc(inData, {
          /*control functions go here*/
        });
        resolve(retval);
      });
    } /// toNetwork


    if (toNet) {
      if (!channel.NET) throw Error('net calls must use NET: message prefix');
      type = type || 'mcall';
      let pkt = new NetMessage(mesgName, inData, type);
      let p = pkt.PromiseTransaction();
      promises.push(p);
    } // end toNetwork
    /// do the work


    let resArray = await Promise.all(promises);
    let resObj = Object.assign({}, ...resArray);
    return resObj;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Get list of messages that are handled by this Messager instance.
   * @returns {Array<string>} message name strings
   */


  MessageNames() {
    let handlers = [];
    this.handlerMap.forEach((set, key) => {
      handlers.push(key);
      if (DBG) console.log(`handler: ${key}`);
    });
    return handlers;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Get list of messages that are published to the network
   * @returns {Array<string>} message name strings
   */


  NetMessageNames() {
    let handlers = [];
    this.handlerMap.forEach((set, key) => {
      let addMessage = false; // eslint-disable-next-line no-return-assign, no-bitwise

      set.forEach(func => addMessage |= func.fromNet === true);
      if (addMessage) handlers.push(key);
    });
    return handlers;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Check to see if a message is handled by this Messager instance
   * @param {string=''} msg message name to check
   * @returns {boolean} true if message name is handled
   */


  HasMessageName(msg = '') {
    return this.handlerMap.has(msg);
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Ensure that the passed message names really exist in this Messager
   * instance
   * @param {Array<string>} msgs
   */


  ValidateMessageNames(msgs = []) {
    const valid = [];
    msgs.forEach(name => {
      if (this.HasMessageName(name)) valid.push(name);else throw new Error(`ValidateMessageNames() found invalid message '${name}'`);
    });
    return valid;
  }

} // class Messager
/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


module.exports = Messager;

/***/ }),

/***/ "./src/class-netmessage.js":
/*!*********************************!*\
  !*** ./src/class-netmessage.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* eslint-disable @typescript-eslint/no-use-before-define */

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable lines-between-class-members */

/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NetMessage objects are sent between the browser and server as part of the
  URSYS messaging system. NetMessages do not need addresses.

  This NetMessage declaration is SHARED in both node and browser javascript
  codebases.

  FEATURES

  * handles asynchronous transactions
  * works in both node and browser contexts
  * has an "offline mode" to suppress network messages without erroring

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/
/// DEPENDENCIES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS = __webpack_require__(/*! ./util-prompts */ "./src/util-prompts.js"); /// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


const DBG = {
  send: false,
  transact: false,
  setup: false
};
const PR = PROMPTS.Pad('PKT');
const ERR = ':ERR:';
const PERR = ERR + PR;
const ERR_NOT_NETMESG = `${PERR}obj does not seem to be a NetMessage`;
const ERR_BAD_PROP = `${PERR}property argument must be a string`;
const ERR_ERR_BAD_CSTR = `${PERR}constructor args are string, object`;
const ERR_BAD_SOCKET = `${PERR}sender object must implement send()`;
const ERR_DUPE_TRANS = `${PERR}this packet transaction is already registered!`;
const ERR_NO_GLOB_UADDR = `${PERR}packet sending attempted before UADDR is set!`;
const ERR_UNKNOWN_TYPE = `${PERR}packet type is unknown:`;
const ERR_NOT_PACKET = `${PERR}passed object is not a NetMessage`;
const ERR_UNKNOWN_RMODE = `${PERR}packet routine mode is unknown:`; /// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const M_INIT = 'init';
const M_ONLINE = 'online';
const M_STANDALONE = 'offline';
const M_CLOSED = 'closed';
const M_ERROR = 'error';
const VALID_CHANNELS = ['LOCAL', 'NET', 'STATE']; // * is all channels in list
/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

let m_id_counter = 0;
let m_id_prefix = 'PKT';
let m_transactions = {};
let m_netsocket = null;
let m_group_id = null;
let m_mode = M_INIT; /// ENUMS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const PACKET_TYPES = ['msend', // a 'send' message returns no data
'msig', // a 'signal' message is a send that calls all handlers everywhere
'mcall', // a 'call' message returns data
'state' // (unimplemented) a 'state' message is used by a state manager
];
const TRANSACTION_MODE = ['req', // packet in initial 'request' mode
'res' // packet in returned 'response' mode
]; /// URSYS NETMESSAGE CLASS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Class NetMessage
 * Container for messages that can be sent across the network to the URSYS
 * server.
 * @typedef {Object} NetMessage
 * @property {string} msg - message
 * @property {Object} data - message data
 * @property {string} id - internal id
 * @property {string} type - packet operation type (1way,2way,sync)
 * @property {string} rmode - transaction direction
 * @property {string} memo - human-readable debug note space
 * @property {string} seqnum - sequence number for transaction
 * @property {Array} seqlog - array of seqnums, starting with originating address
 * @property {string} s_uid - originating browser internal endpoint
 * @property {string} s_uaddr - originating browser address
 * @property {string} s_group - group session key
 */

class NetMessage {
  /** constructor
   * @param {string|object} msg message name, or an existing plain object to coerce into a NetMessage
   * @param {Object} data data packet to send
   * @param {string} type the message (defined in PACKET_TYPES)
   */
  constructor(msg, data, type) {
    // OPTION 1
    // create NetMessage from (generic object)
    if (typeof msg === 'object' && data === undefined) {
      // make sure it has a msg and data obj
      if (typeof msg.msg !== 'string' || typeof msg.data !== 'object') {
        throw Error(ERR_NOT_NETMESG);
      } // merge properties into this new class instance and return it


      Object.assign(this, msg);
      this.seqlog = this.seqlog.slice(); // copy array

      m_SeqIncrement(this);
      return this;
    } // OPTION 2
    // create NetMessage from JSON-encoded string


    if (typeof msg === 'string' && data === undefined) {
      let obj = JSON.parse(msg);
      Object.assign(this, obj);
      m_SeqIncrement(this);
      return this;
    } // OPTION 3
    // create new NetMessage from scratch (mesg,data)
    // unique id for every NetMessage


    if (typeof type === 'string') m_CheckType(type);

    if (typeof msg !== 'string' || typeof data !== 'object') {
      throw Error(ERR_ERR_BAD_CSTR);
    } // allow calls with null data by setting to empty object


    this.data = data || {};
    this.msg = msg; // id and debugging memo support

    this.id = this.MakeNewID();
    this.rmode = TRANSACTION_MODE[0]; // is default 'request' (trans request)

    this.type = type || PACKET_TYPES[0]; // is default 'msend' (no return)

    this.memo = ''; // transaction support

    this.seqnum = 0; // positive when part of transaction

    this.seqlog = []; // transaction log
    // addressing support

    this.s_uaddr = NetMessage.SocketUADDR() || null; // first originating uaddr set by SocketSend()

    this.s_group = null; // session groupid is set by external module once validated

    this.s_uid = null; // first originating ULINK srcUID
    // filtering support
  } // constructor
  /// ACCESSSOR METHODS ///////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.Type() returns the TRANSACTION_TYPE of this packet
   */


  Type() {
    return this.type;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.Type() returns true if type matches
   * @param {string} type the type to compare with the packet's type
   * @returns {boolean}
   */


  IsType(type) {
    return this.type === type;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.SetType() sets the type of the packet. Must be a known type
   * in PACKET_TYPES
   */


  SetType(type) {
    this.type = m_CheckType(type);
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** returns the message string of form CHANNEL:MESSAGE, where CHANNEL:
   * is optional
   */


  Message() {
    return this.msg;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** returns MESSAGE without the CHANNEL: prefix. The channel (e.g.
   * NET, LOCAL, STATE) is also set true
   */


  DecodedMessage() {
    return NetMessage.ExtractChannel(this.msg);
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.Is() returns truthy value (this.data) if the passed msgstr
   *  matches the message associated with this NetMessage
   */


  Is(msgstr) {
    return msgstr === this.msg ? this.data : undefined;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.IsServerMessage() is a convenience function return true if
   * server message */


  IsServerMessage() {
    return this.msg.startsWith('NET:SRV_');
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.SetMessage() sets the message field
   */


  SetMessage(msgstr) {
    this.msg = msgstr;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.Data() returns the entire data payload or the property within
   * the data payload (can return undefined if property doesn't exist)
   */


  Data(prop) {
    if (!prop) return this.data;
    if (typeof prop === 'string') return this.data[prop];
    throw Error(ERR_BAD_PROP);
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Convenience method to set data object entirely
   */


  SetData(propOrVal, val) {
    if (typeof propOrVal === 'object') {
      this.data = propOrVal;
      return;
    }

    if (typeof propOrVal === 'string') {
      this.data[propOrVal] = val;
      return;
    }

    throw Error(ERR_BAD_PROP);
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.Memo() returns the 'memo' field of the packet */


  Memo() {
    return this.memo;
  }

  SetMemo(memo) {
    this.memo = memo;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.JSON() returns a stringified JSON version of the packet. */


  JSON() {
    return JSON.stringify(this);
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.SourceGroupId() return the session group id associated with
   * this packet.
   */


  SourceGroupID() {
    return this.s_group;
  } /// TRANSACTION SUPPORT /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.SeqNum() returns a non-positive integer that is the number of
   * times this packet was reused during a transaction (e.g. 'mcall' types).
   */


  SeqNum() {
    return this.seqnum;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.SourceAddress() returns the originating browser of the packet,
   * which is the socketname maintained by the URSYS server. It is valid only
   * after the URSYS server has received it, so it is invalid when a NetMessage
   * packet is first created.
   */


  SourceAddress() {
    /*/ NOTE
         s_uaddr is the most recent sending browser.
         If a NetMessage packet is reused in a transaction (e.g. a call that returns
        data) then the originating browser is the first element in the transaction
        log .seqlog
    /*/
    // is this packet originating from server to a remote?
    if (this.s_uaddr === NetMessage.DefaultServerUADDR() && !this.msg.startsWith('NET:SVR_')) {
      return this.s_uaddr;
    } // this is a regular message forward to remote handlers


    return this.IsTransaction() ? this.seqlog[0] : this.s_uaddr;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** Return true if this pkt is from the server targeting remote handlers
   */


  IsServerOrigin() {
    return this.SourceAddress() === NetMessage.DefaultServerUADDR();
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.CopySourceAddress() copies the source address of sets the
   * current address to the originating URSYS browser address. Used by server
   * forwarding and returning packets between remotes.
   * @param {NetMessage} pkt - the packet to copy source from
   */


  CopySourceAddress(pkt) {
    if (pkt.constructor.name !== 'NetMessage') throw Error(ERR_NOT_PACKET);
    this.s_uaddr = pkt.SourceAddress();
  } /// - - - - - - - - server- - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.Info() returns debug information about the packet
   * @param {string} key - type of debug info (always 'src' currently)
   * @returns {string} source browser + group (if set)
   */


  Info(key) {
    switch (key) {
      case 'src':
      /* falls-through */

      default:
        return this.SourceGroupID() ? `${this.SourceAddress()} [${this.SourceGroupID()}]` : `${this.SourceAddress()}`;
    }
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.MakeNewID() is a utility method that generates a unique id for
   * each NetMessage packet. When combined with s_uaddr and s_srcuid, this gives
   * a packet a unique ID across the entire URSYS network.
   * @returns {string} unique id
   */


  MakeNewID() {
    let idStr = (++m_id_counter).toString();
    this.id = m_id_prefix + idStr.padStart(5, '0');
    return this.id;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.SocketSend() is a convenience method to let packets 'send
   * themselves' to the network via the URSYS server.
   * @param {Object=m_socket} socket - web socket object. m_socket
   * is defined only on browsers; see NetMessage.GlobalSetup()
   */


  SocketSend(socket = m_netsocket) {
    if (m_mode === M_ONLINE || m_mode === M_INIT) {
      this.s_group = NetMessage.GlobalGroupID();
      let dst = socket.UADDR || 'unregistered socket';
      if (!socket) throw Error('SocketSend(sock) requires a valid socket');

      if (DBG.send) {
        let status = `sending '${this.Message()}' to ${dst}`;
        console.log(PR, status);
      } // for server-side ws library, send supports a function callback
      // for WebSocket, this is ignored


      socket.send(this.JSON(), err => {
        if (err) console.error(`\nsocket ${socket.UADDR} reports error ${err}\n`);
      });
    } else if (m_mode !== M_STANDALONE) {
      console.log(PR, "SocketSend: Can't send because NetMessage mode is", m_mode);
    } else {
      console.warn(PR, 'STANDALONE MODE: SocketSend() suppressed!');
    } // FYI: global m_netsocket is not defined on server, since packets arrive on multiple sockets

  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.PromiseTransaction() maps a packet to a return handler using a
   * unique key. This key allows an incoming packet to be mapped back to the
   * caller even if it is technically a different object received over the
   * network.
   * @param {Object=m_socket} socket - web socket object. m_socket is defined
   * only on browsers; see NetMessage.GlobalSetup()
   */


  PromiseTransaction(socket = m_netsocket) {
    if (m_mode === M_STANDALONE) {
      console.warn(PR, 'STANDALONE MODE: PromiseTransaction() suppressed!');
      return Promise.resolve();
    } // global m_netsocket is not defined on server, since packets arrive on multiple sockets


    if (!socket) throw Error('PromiseTransaction(sock) requires a valid socket'); // save our current UADDR

    this.seqlog.push(NetMessage.UADDR);
    let dbg = DBG.transact && !this.IsServerMessage();
    let p = new Promise((resolve, reject) => {
      let hash = m_GetHashKey(this);

      if (m_transactions[hash]) {
        reject(Error(`${ERR_DUPE_TRANS}:${hash}`));
      } else {
        // save the resolve function in transactions table;
        // promise will resolve on remote invocation with data
        m_transactions[hash] = data => {
          if (dbg) {
            console.log(PR, 'resolving promise with', JSON.stringify(data));
          }

          resolve(data);
        };

        this.SocketSend(socket);
      }
    });
    return p;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.RoutingMode() returns the direction of the packet to a
   * destination handler (req) or back to the origin (res).  */


  RoutingMode() {
    return this.rmode;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.IsRequest() returns true if this packet is one being sent
   * to a remote handler
   */


  IsRequest() {
    return this.rmode === 'req';
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.IsResponse() returns true if this is a packet
   * being returned from a remote handler
   * @returns {boolean} true if this is a transaction response
   */


  IsResponse() {
    return this.rmode === 'res'; // more bulletproof check, but unnecessary
    // return this.rmove ==='res' && this.SourceAddress() === NetMessage.UADDR;
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.IsTransaction() tests whether the packet is a response to a
   * call that was sent out previously.
   */


  IsTransaction() {
    return this.rmode !== 'req' && this.seqnum > 0 && this.seqlog[0] === NetMessage.UADDR;
  } ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.ReturnTransaction() is used to send a packet back to its
   * origin. It saves the current browser address (stored in NetMessage.UADDR),
   * sets the direction of the packet, and puts it on the socket.
   * @param {Object=m_socket} socket - web socket object. m_socket is defined
   * only on browsers; see NetMessage.GlobalSetup()
   */


  ReturnTransaction(socket = m_netsocket) {
    // global m_netsocket is not defined on server, since packets arrive on multiple sockets
    if (!socket) throw Error('ReturnTransaction(sock) requires a valid socket'); // note: seqnum is already incremented by the constructor if this was
    // a received packet
    // add this to the sequence log

    this.seqlog.push(NetMessage.UADDR);
    this.rmode = m_CheckRMode('res');
    this.SocketSend(socket);
  } /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** NetMessage.CompleteTransaction() is called when a packet is received back
   * from the remote handler. At this point, the original caller needs to be
   * informed via the saved function handler created in
   * NetMessage.PromiseTransaction().
   */


  CompleteTransaction() {
    let dbg = DBG.transact && !this.IsServerMessage();
    let hash = m_GetHashKey(this);
    let resolverFunc = m_transactions[hash];
    if (dbg) console.log(PR, 'CompleteTransaction', hash);

    if (typeof resolverFunc !== 'function') {
      throw Error(`transaction [${hash}] resolverFunction is type ${typeof resolverFunc}`);
    } else {
      resolverFunc(this.data);
      Reflect.deleteProperty(m_transactions[hash]);
    }
  }

} // class NetMessage
/// STATIC CLASS METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** NetMessage.GlobalSetup() is a static method that initializes shared
 * parameters for use by all instances of the NetMessage class. It is used only
 * on browsers, which have a single socket connection.
 *
 * If no netsocket property is defined, then NetMessage instances will surpress
 * sending of network messages while allowing local messages to work normally.
 * See NetMessage.GlobalOfflineMode() for more information.
 * @function
 * @param {Object} [config] - configuration object
 * @param {Object} [config.netsocket] - valid websocket to URSYS server
 * @param {Object} [config.uaddr] - URSYS browser address
 */


NetMessage.GlobalSetup = (config = {}) => {
  let {
    uaddr,
    netsocket,
    peers,
    is_local
  } = config;
  if (uaddr) NetMessage.UADDR = uaddr;
  if (peers) NetMessage.PEERS = peers;

  if (netsocket) {
    // NOTE: m_netsocket is set only on clients since on server, there are
    // multiple sockets
    if (typeof netsocket.send !== 'function') throw Error(ERR_BAD_SOCKET);
    if (DBG.setup) console.log(PR, 'GlobalSetup: netsocket set, mode online');
    m_netsocket = netsocket;
    m_mode = M_ONLINE;
  }

  if (is_local) NetMessage.ULOCAL = is_local;
};

NetMessage.UADDR = 'UNASSIGNED';
NetMessage.ULOCAL = false; // set if connection is a local connection

NetMessage.PEERS = undefined; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** NetMessage.GlobalCleanup() is a static method called only by the client,
 * which drops the current socket and puts the app in 'closed' state. In
 * practice this call doesn't accomplish much, but is here for symmetry to
 * GlobalSetup().
 * @function
 */

NetMessage.GlobalCleanup = () => {
  if (m_netsocket) {
    if (DBG.setup) console.log(PR, 'GlobalCleanup: deallocating netsocket, mode closed');
    m_netsocket = null;
    m_mode = M_CLOSED;
    NetMessage.ULOCAL = false;
  }
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Static method NetMessage.GlobalOfflineMode() explicitly sets the mode to STANDALONE, which
 * actively suppresses remote network communication without throwing errors.
 * It's used for static code snapshots of the webapp that don't need the
 * network.
 * @function
 */


NetMessage.GlobalOfflineMode = () => {
  m_mode = M_STANDALONE;

  if (m_netsocket) {
    console.warn(PR, 'STANDALONE MODE: NetMessage disabling network');
    m_netsocket = null;
    let event = new CustomEvent('URSYSDisconnect', {});
    console.log('dispatching event to', document, event);
    document.dispatchEvent(event);
  }
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Converts 'CHANNEL:MESSAGE' string to an object with channel, message
 * properties. If there is more than one : in the message string, it's left
 * as part of the message. All properties returned in are UPPERCASE.
 * @param {string} message - message with optional channel prefix
 * @returns {Object} - contains channel (UC) that are set
 * @example
 * const parsed = NetMessage.DecodeChannel('NET:MY_MESSAGE');
 * if (parsed.NET) console.log('this is true');
 * if (parsed.LOCAL) console.log('this is false');
 * console.log('message is',parsed.MESSAGE);
 */


NetMessage.ExtractChannel = function ExtractChannel(msg) {
  let [channel, MESSAGE] = msg.split(':', 2); // no : found, must be local

  if (!MESSAGE) {
    MESSAGE = channel;
    channel = '';
  }

  const parsed = {
    MESSAGE
  };

  if (!channel) {
    parsed.LOCAL = true;
    return parsed;
  }

  if (channel === '*') {
    VALID_CHANNELS.forEach(chan => {
      parsed[chan] = true;
    });
    return parsed;
  }

  if (VALID_CHANNELS.includes(channel)) {
    parsed[channel] = true;
    return parsed;
  } // legacy messages use invalid channel names
  // for now forward them as-is


  console.warn(`'${msg}' replace : with _`);
  parsed.LOCAL = true;
  return parsed; // this is what should actually happen
  // throw Error(`invalid channel '${channel}'`);
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** NetMessage.SocketUADDR() is a static method returning the class-wide setting
 * of the browser UADDR. This is only used on browser code.
 * @function
 * @returns {string} URSYS address of the current browser, a URSYS address
 */


NetMessage.SocketUADDR = () => {
  return NetMessage.UADDR;
};

NetMessage.Peers = () => {
  return NetMessage.PEERS;
};

NetMessage.IsLocalhost = () => {
  return NetMessage.ULOCAL;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** NetMessage.DefaultServerUADDR() is a static method returning a hardcoded
 * URSYS address referring to the URSYS server. It is used by the server-side
 * code to set the server address, and the browser can rely on it as well.
 * @function
 * @returns {string} URSYS address of the server
 */


NetMessage.DefaultServerUADDR = () => {
  return 'SVR_01';
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** NetMessage.GlobalGroupID() is a static method returning the session key
 * (aka group-id) set for this browser instance
 * @function
 * @returns {string} session key
 */


NetMessage.GlobalGroupID = () => {
  return m_group_id;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** NetMessage.GlobalSetGroupID() is a static method that stores the passed
 * token as the GroupID
 * @function
 * @param {string} token - special session key data
 */


NetMessage.GlobalSetGroupID = token => {
  m_group_id = token;
}; /// PRIVATE CLASS HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ DEPRECATE? Utility function to increment the packet's sequence number
 *  @param {NetMessage} pkt - packet to modify
/*/


function m_SeqIncrement(pkt) {
  pkt.seqnum++;
  return pkt;
} ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ Utility to create a unique hash key from packet information. Used by
 *  PromiseTransaction().
 *  @param {NetMessage} pkt - packet to use
 *  @return {string} hash key string
/*/


function m_GetHashKey(pkt) {
  let hash = `${pkt.SourceAddress()}:${pkt.id}`;
  return hash;
} ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ Utility to ensure that the passed type is one of the allowed packet types.
 *  Throws an error if it is not.
 *  @param {string} type - a string to be matched against PACKET_TYPES
 *  @returns {string} the string that passed the type check
/*/


function m_CheckType(type) {
  if (type === undefined) {
    throw new Error(`must pass a type string, not ${type}`);
  }

  if (!PACKET_TYPES.includes(type)) throw Error(`${ERR_UNKNOWN_TYPE} '${type}'`);
  return type;
} ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ Utility to ensure the passed transaction mode is one of the allowed
 *  types. Throws an error if it is not.
 *  @param {string} mode - a string to be matched against TRANSACTION_MODE
 *  @returns {string} the string the passed the mode check
/*/


function m_CheckRMode(mode) {
  if (mode === undefined) {
    throw new Error(`must pass a mode string, not ${mode}`);
  }

  if (!TRANSACTION_MODE.includes(mode)) throw Error(`${ERR_UNKNOWN_RMODE} '${mode}'`);
  return mode;
} /// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


NetMessage.CODE_OK = 0;
NetMessage.CODE_NO_MESSAGE = 1; // requested message doesn't exist

NetMessage.CODE_SOC_NOSOCK = -100;
NetMessage.CODE_SES_REQUIRE_KEY = -200; // access key not set

NetMessage.CODE_SES_REQUIRE_LOGIN = -201; // socket was not logged-in

NetMessage.CODE_SES_INVALID_KEY = -202; // provided key didn't match socket key

NetMessage.CODE_SES_RE_REGISTER = -203; // session attempted to login again

NetMessage.CODE_SES_INVALID_TOKEN = -204; // session attempted to login again

NetMessage.CODE_REG_DENIED = -300; // registration of handler denied
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// using CommonJS format on purpose for node compatibility

module.exports = NetMessage;

/***/ }),

/***/ "./src/index-client.js":
/*!*****************************!*\
  !*** ./src/index-client.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(__filename) {/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS C:OEMT

  chrome:   events, exec, extensions, link, network, pubsub
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const COMMON = __webpack_require__(/*! ./modules-common */ "./src/modules-common.js"); /// META-DATA /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


const META = {
  _CLIENT: true,
  _SCRIPT: __filename,
  _VERSION: '0.0.1'
}; /// CLIENT-SIDE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const Events = {};
const Exec = {};
const Extensions = {};
const Link = {};
const Network = {};
const PubSub = {}; /// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function Init() {
  return `${META._SCRIPT} ${META._VERSION}`;
} /// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


module.exports = { // META
  ...META,
  // MAIN API
  Init,
  // SERVICES API
  Events,
  Exec,
  Extensions,
  Link,
  Network,
  PubSub,
  // CONVENIENCE
  ...COMMON
};
/* WEBPACK VAR INJECTION */}.call(this, "src/index-client.js"))

/***/ }),

/***/ "./src/modules-common.js":
/*!*******************************!*\
  !*** ./src/modules-common.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODULES USED IN BOTH URSYS CLIENT and SERVER
  commmon:  datamap, messager, netmessage, valuebinding, datestring, session

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const Messager = __webpack_require__(/*! ./class-messager */ "./src/class-messager.js");

const NetMessage = __webpack_require__(/*! ./class-netmessage */ "./src/class-netmessage.js");

const DateString = __webpack_require__(/*! ./util-datestring */ "./src/util-datestring.js");

const Session = __webpack_require__(/*! ./util-session */ "./src/util-session.js"); /// EXPORT ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


module.exports = {
  Messager,
  NetMessage,
  DateString,
  Session
};

/***/ }),

/***/ "./src/util-datestring.js":
/*!********************************!*\
  !*** ./src/util-datestring.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

/////////////////////////////////////////////////////////////////////////////

/**	UTILITY FUNCTIONS ******************************************************/
// enums for outputing dates
const e_weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function str_TimeStamp() {
  let date = new Date();
  let hh = `0${date.getHours()}`.slice(-2);
  let mm = `0${date.getMinutes()}`.slice(-2);
  let ss = `0${date.getSeconds()}`.slice(-2);
  return `${hh}:${mm}:${ss}`;
} ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


function str_DateStamp() {
  let date = new Date();
  let mm = `0${date.getMonth() + 1}`.slice(-2);
  let dd = `0${date.getDate()}`.slice(-2);
  let day = e_weekday[date.getDay()];
  let yyyy = date.getFullYear();
  return `${yyyy}/${mm}/${dd} ${day}`;
} ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 *  return a filename of form YYYY-MMDD-args-separated-by-dashes-HHMMSS
 */


function str_TimeDatedFilename(...args) {
  // construct filename
  let date = new Date();
  let dd = `0${date.getDate()}`.slice(-2);
  let mm = `0${date.getMonth() + 1}`.slice(-2);
  let hms = `0${date.getHours()}`.slice(-2);
  hms += `0${date.getMinutes()}`.slice(-2);
  hms += `0${date.getSeconds()}`.slice(-2);
  let filename;
  filename = date.getFullYear().toString();
  filename += `-${mm}${dd}`;
  let c = arguments.length;
  if (c) filename = filename.concat('-', ...args);
  filename += `-${hms}`;
  return filename;
} ///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


module.exports = {
  TimeStamp: str_TimeStamp,
  DateStamp: str_DateStamp,
  DatedFilename: str_TimeDatedFilename
};

/***/ }),

/***/ "./src/util-prompts.js":
/*!*****************************!*\
  !*** ./src/util-prompts.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  String Prompts for server console

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/
let PROMPTS = {}; /// CONSTANTS /////////////////////////////////////////////////////////////////
/// detect node environment and set padsize accordingly

const IS_NODE = typeof process !== 'undefined' && process.release && process.release.name === 'node';
let PAD_SIZE = IS_NODE ? 13 // nodejs
: 0; // not nodejs

const TERM = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',
  FgBlack: '\x1b[30m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m',
  FgYellow: '\x1b[33m',
  FgBlue: '\x1b[34m',
  FgMagenta: '\x1b[35m',
  FgCyan: '\x1b[36m',
  FgWhite: '\x1b[37m',
  BgBlack: '\x1b[40m',
  BgRed: '\x1b[41m',
  BgGreen: '\x1b[42m',
  BgYellow: '\x1b[43m',
  BgBlue: '\x1b[44m',
  BgMagenta: '\x1b[45m',
  BgCyan: '\x1b[46m',
  BgWhite: '\x1b[47m'
}; /// PROMPT STRING HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ return a string padded to work as a prompt for either browser or node
    console output
/*/

PROMPTS.Pad = (prompt = '', psize = PAD_SIZE) => {
  let len = prompt.length;
  if (IS_NODE) return `${prompt.padEnd(psize, ' ')}-`; // must be non-node environment, so do dynamic string adjust

  if (!psize) return `${prompt}:`; // if this far, then we're truncating

  if (len >= psize) prompt = prompt.substr(0, psize - 1);else prompt.padEnd(psize, ' ');
  return `${prompt}:`;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ returns PAD_SIZE stars
/*/


PROMPTS.Stars = count => {
  if (count !== undefined) return ''.padEnd(count, '*');
  return ''.padEnd(PAD_SIZE, '*');
};

PROMPTS.TR = TERM.Reset;
PROMPTS.BR = TERM.Bright;
PROMPTS.CWARN = TERM.FgYellow;
PROMPTS.CCRIT = TERM.BgRed + TERM.FgWhite + TERM.Bright;
PROMPTS.CINFO = TERM.BgBlue + TERM.FgWhite;
PROMPTS.TERM_URSYS = TERM.FgBlue + TERM.Bright;
PROMPTS.TERM_DB = TERM.FgBlue; // server-database

PROMPTS.TERM_NET = TERM.FgBlue; // server-network

PROMPTS.TERM_EXP = TERM.FgMagenta; // server-express

PROMPTS.TERM_WPACK = TERM.FgGreen; // webpack configurations

PROMPTS.CW = TERM.FgGreen; // webpack configurations

PROMPTS.CY = TERM.FgYellow;
PROMPTS.TERM = TERM;
PROMPTS.CS = '\x1b[34m\x1b[1m';
PROMPTS.CW = '\x1b[32m';
PROMPTS.CR = '\x1b[0m'; /// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

module.exports = PROMPTS;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/process/browser.js */ "../../node_modules/process/browser.js")))

/***/ }),

/***/ "./src/util-session.js":
/*!*****************************!*\
  !*** ./src/util-session.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* eslint-disable @typescript-eslint/no-use-before-define */

/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable no-param-reassign */

/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Session Utilities
  collection of session-related data structures

  For student logins, we just need to encode the groupId, which will give
  us the classroomId. We also need the name, which is not encoded, but
  can be checked against the groups database.

  <NAME>-HASHED_DATA
  where HASHED_DATA encodes groupId, classroomId

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/
/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const HashIds = __webpack_require__(/*! hashids/cjs */ "./node_modules/hashids/cjs/index.js");

const UUID = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/esm-browser/index.js");

const UUIDv5 = UUID.v5;

const PROMPTS = __webpack_require__(/*! ./util-prompts */ "./src/util-prompts.js"); /// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


const DBG = false;
const PR = PROMPTS.Pad('SESSUTIL'); /// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// HASH_* are used as parameters for hashids (login tokens)

const HASH_ABET = 'ABCDEFGHIJKLMNPQRSTVWXYZ23456789';
const HASH_MINLEN = 3;
const HASH_SALT = 'MEMESALT/2019'; /// UUID_NAMESPACE was arbitrarily generated with 'npx uuid v4' (access keys)

const UUID_NAMESPACE = '1abc839d-b04f-481e-87fe-5d69bd1907b2';
let ADMIN_KEY = ''; // set to non-falsy to disable admin checks

const ADMIN_QSTRING = 'danishpowers'; // used to bypass admin localhost test

const SSHOT_URL = '/screenshots';
const UPLOAD_URL = `${SSHOT_URL}/upload`; /// MODULE DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

let m_current_name; // global decoded name (only for browsers)

let m_current_idsobj = {}; // global decoded props (only for browsers)

let m_access_key = ''; // global access key (saved only for browsers)
/// SESSION ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const SESSION = {}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ Given a token of form NAME-HASHED_DATA, return an object
    containing as many decoded values as possible. Check isValid for
    complete decode succes. groupId is also set if successful
/*/

SESSION.DecodeToken = hashedToken => {
  let studentName;
  let hashedData; // token

  let groupId;
  let classroomId; // decoded data

  let isValid = false; // is a valid token?

  if (typeof hashedToken !== 'string') return {
    isValid,
    error: 'token must be a string'
  }; // token is of form NAME-HASHEDID
  // (1) check student name

  const token = hashedToken.toUpperCase();
  const tokenBits = token.toUpperCase().split('-');
  if (tokenBits.length === 1) return {
    isValid,
    token,
    error: 'missing - in token'
  };
  if (tokenBits.length > 2) return {
    isValid,
    token,
    error: 'too many - in token'
  };
  if (tokenBits[0]) studentName = tokenBits[0].toUpperCase();
  if (studentName.length < 3) return {
    isValid,
    token,
    error: 'student name must have 3 or more letters'
  }; // (2) check hashed data

  if (tokenBits[1]) hashedData = tokenBits[1].toUpperCase(); // initialize hashid structure

  let hashids = new HashIds(HASH_SALT + studentName, HASH_MINLEN, HASH_ABET); // try to decode the groupId

  const dataIds = hashids.decode(hashedData); // invalidate if couldn't decode

  if (dataIds.length === 0) return {
    isValid,
    token,
    error: 'invalid token'
  }; // at this point groupId is valid (begins with ID, all numeric)
  // check for valid subgroupId

  [groupId, classroomId] = dataIds;
  isValid = true;
  return {
    isValid,
    studentName,
    token,
    groupId,
    classroomId
  };
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*/ Return TRUE if the token decodes into an expected range of values
/*/


SESSION.IsValidToken = token => {
  let decoded = SESSION.DecodeToken(token);
  return decoded && Number.isInteger(decoded.groupId) && typeof decoded.studentName === 'string';
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Returns a token string of form NAME-HASHED_DATA
 * @param {String} studentName
 * @param {Object} dataIds
 * @param {Number} dataIds.groupId
 * @param {Number} dataIds.classroomId
 */


SESSION.MakeToken = (studentName, dataIds = {}) => {
  // type checking
  if (typeof studentName !== 'string') throw Error(`classId arg1 '${studentName}' must be string`);
  let err; // eslint-disable-next-line no-cond-assign

  if (err = f_checkIdValue(dataIds)) {
    console.warn(`Could not make token. ${err}`);
    return undefined;
  } // initialize hashid structure


  studentName = studentName.toUpperCase();
  const {
    groupId,
    classroomId
  } = dataIds;
  let hashids = new HashIds(HASH_SALT + studentName, HASH_MINLEN, HASH_ABET);
  let hashedId = hashids.encode(groupId, classroomId);
  return `${studentName}-${hashedId}`;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Returns a token string of form NAME-HASHED_DATA
 * @param {String} teacherName
 * @param {Object} dataIds
 * @param {Number} dataIds.groupId
 * @param {Number} dataIds.teacherId
 */


SESSION.MakeTeacherToken = (teacherName, dataIds = {}) => {
  // type checking
  if (typeof teacherName !== 'string') throw Error(`classId arg1 '${teacherName}' must be string`);
  let err; // eslint-disable-next-line no-cond-assign

  if (err = f_checkIdValue(dataIds)) {
    console.warn(`Could not make token. ${err}`);
    return undefined;
  } // convert to alphanumeric no spaces


  const tokName = teacherName.replace(/\W/g, ''); // initialize hashid structure

  teacherName = tokName.toUpperCase();
  const {
    groupId,
    teacherId
  } = dataIds;
  let hashids = new HashIds(HASH_SALT + teacherName, HASH_MINLEN, HASH_ABET);
  let hashedId = hashids.encode(groupId, teacherId);
  return `${teacherName}-${hashedId}`;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// support function


function f_checkIdValue(idsObj) {
  const ids = Object.keys(idsObj);
  let error = '';
  ids.forEach(key => {
    const val = idsObj[key];

    if (!Number.isInteger(val)) {
      error += `'${key}' is not an integer. `;
      return;
    }

    if (val < 0) {
      error += `'${key}' must be non-negative integer. `;
      return;
    }

    if (val > Number.MAX_SAFE_INTEGER) {
      error += `'${key}' exceeds MAX_SAFE_INTEGER. `;
    }
  });
  return error;
} /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** Makes a 'access key' that is not very secure, but unique enough to serve
 * as an authentication key based on a login token
 * @param {...*} var_args - string arguments
 */


SESSION.MakeAccessKey = (...args) => {
  const name = [...args].join(':');
  const key = UUIDv5(name, UUID_NAMESPACE);
  return key;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Set the global GROUPID, which is included in all NetMessage packets that are
 * sent to server. Do not use from server-based code.
 */


SESSION.DecodeAndSet = token => {
  const decoded = SESSION.DecodeToken(token);
  const {
    isValid,
    studentName,
    groupId,
    classroomId
  } = decoded;

  if (isValid) {
    m_current_name = studentName;
    m_current_idsobj = {
      studentName,
      groupId,
      classroomId
    }; // handle teacher login
    // in this case, the groupId is 0 and classroomId is actually
    // teacherId, so update the object

    if (groupId === 0) {
      console.warn(`INFO: TEACHER LOGIN '${studentName}'`);
      m_current_idsobj.teacherId = classroomId;
      m_current_idsobj.teacherName = studentName;
      m_current_idsobj.classroomId = undefined;
    }

    if (DBG) console.log('DecodeAndSet() success', studentName, groupId, classroomId);
  } else if (DBG) console.log('DecodeAndSet() failed', token);

  return isValid;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Clear all global session parameters. Do not use from server-based code.
 */


SESSION.Clear = () => {
  if (DBG) console.log('Clearing session');
  m_current_name = undefined;
  m_current_idsobj = undefined;
  m_access_key = undefined;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Set the global SESSION ACCESS KEY, which is necessary as a parameter for
 * some operations (e.g. database writes). Do not use from server-based code.
 */


SESSION.SetAccessKey = key => {
  if (typeof key === 'string') {
    m_access_key = key;
    if (DBG) console.log('setting access key', key);
  }
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Return the global SESSION ACCESS KEY that was set using SetAccessKey(). Don't
 * use this from server-based code.
 */


SESSION.AccessKey = () => {
  if (DBG) console.log('AccessKey() returning', m_access_key);
  return m_access_key;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


SESSION.SetAdminKey = key => {
  ADMIN_KEY = key || ADMIN_KEY;
  return ADMIN_KEY;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * This is TOTALLY INSECURE and not even trying for the prototype
 */


SESSION.AdminKey = () => {
  const is = ADMIN_KEY || false;
  if (DBG) console.warn('INFO: requested AdminKey()');
  return is;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Return teacherId if this is a logged-in teacher
 */


SESSION.LoggedInProps = () => {
  const {
    groupId,
    classroomId,
    teacherId
  } = m_current_idsobj;

  if (groupId === 0) {
    return {
      teacherName: m_current_name,
      teacherId
    };
  }

  return {
    studentName: m_current_name,
    groupId,
    classroomId
  };
};

SESSION.IsStudent = () => {
  return SESSION.LoggedInProps().studentName !== undefined;
};

SESSION.IsTeacher = () => {
  return SESSION.LoggedInProps().teacherName !== undefined;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Return the global LoggedInName that was set using DecodeAndSet(). Don't use
 * this from server-based code.
 */


SESSION.LoggedInName = () => {
  return m_current_name;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Return the global idsObject containing groupId, classroomId that was set
 * using DecodeAndSet(). Don't use this from server-based code.
 */


SESSION.Ids = () => {
  return m_current_idsobj;
}; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


SESSION.AdminPlaintextPassphrase = () => ADMIN_QSTRING; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


SESSION.ScreenshotURL = () => SSHOT_URL;

SESSION.ScreenshotPostURL = () => UPLOAD_URL; /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


module.exports = SESSION;

/***/ })

/******/ });
});