/*
 * gnirts
 * https://github.com/anseki/gnirts
 *
 * Copyright (c) 2015 anseki
 * Licensed under the MIT license.
 */

'use strict';
var MAX_LEN_R36 = 10, // i.e. (Number.MAX_SAFE_INTEGER).toString(36).length - 1
  R36_BLOCKS_TABLE = [
    {pattern: '[\\x00-\\x19]', offset: -97},
    {pattern: '[\\x1a-\\x2f]', offset: -71},
    {pattern: '[\\x3a-\\x53]', offset: -39},
    {pattern: '[\\x54-\\x60]', offset: -13},
    {pattern: '[\\x7b-\\x7f]', offset: 26}
  ],
  TPL_CHARCODE =
  /*
(function() {
  var args = Array.prototype.slice.call(arguments),
    shift1 = args.shift();
  return args.reverse().map(function(charCode, i) {
    return String.fromCharCode(charCode - shift1 - shift2 - i);
  }).join('');
})()
  */
  '(function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-@SHIFT2@-O)}).join(\'\')})(@ARGS@)',

  reR36 = new RegExp('([0-9a-z]{1,' + MAX_LEN_R36 + '})' +
    R36_BLOCKS_TABLE.map(function(block) {
      return '|(' + block.pattern + '{1,' + MAX_LEN_R36 + '})';
    }).join('') + '|([^\\x00-\\x7f]+)'/* invalid */, 'g');

function getCode4string(str) {
  var reNonAscii = /[^\x00-\x7f]/,
    maxLen, strPart, partLen, tryR36 = false, arrCode = [];

  function getCodeWithCharCode(str) {
    var shift1 = Math.floor(Math.random() * 64), // 0..65
      shift2 = Math.floor(Math.random() * 64), // 0..65
      index = str.length, args = [], code = TPL_CHARCODE;

    while ((--index) > -1)
      { args.push(str.charCodeAt(index) + shift1 + shift2 + index); }
    args.unshift(shift1);

    return code.replace(/@SHIFT2@/g, shift2).replace(/@ARGS@/g, args.join(','));
  }

  function getCodeWithR36(str) {
    var matches, arrCode = [];

    function _getCodeWithR36(str) {
      var leadingZeros = '';
      str.replace(/^(0+)(?=.)/, function(s, zeros) {
        leadingZeros = '\'' + zeros + '\'+';
        return '';
      });
      return leadingZeros + '(' + parseInt(str, 36) + ').toString(36).toLowerCase()';
    }

    function checkBlock(block, i) {
      if (matches[i + 2]) {
        arrCode.push(
          _getCodeWithR36(
            matches[i + 2].split('').map(function(chr) {
              return String.fromCharCode(chr.charCodeAt() - block.offset);
            }).join('')
          ) +
          '.split(\'\').map(function(O){return String.fromCharCode(O.charCodeAt()+(' +
            block.offset + '))}).join(\'\')'
        );
        return true;
      }
    }

    while ((matches = reR36.exec(str))) {
      if (matches[1]) {
        arrCode.push(_getCodeWithR36(matches[1]));
      } else if (!R36_BLOCKS_TABLE.some(checkBlock) &&
          matches[R36_BLOCKS_TABLE.length + 2]) {
        throw new Error('Invalid string(R36): ' + matches[R36_BLOCKS_TABLE.length + 2]);
      }
    }

    return arrCode.join('+');
  }

  str += '';
  if (!str) { return '\'\''; }
  maxLen = Math.max(Math.floor(str.length / 3), 1);

  while (str) {
    partLen = Math.floor(Math.random() * Math.min(maxLen, str.length)) + 1;
    strPart = str.substr(0, partLen);
    str = str.substr(partLen);
    if (tryR36 && !reNonAscii.test(strPart)) {
      arrCode.push(getCodeWithR36(strPart));
      tryR36 = false;
    } else {
      arrCode.push(getCodeWithCharCode(strPart));
      tryR36 = true;
    }
  }

  return arrCode.join('+');
}

function getCode4match(target, str) {
  var maxLen, codePart, partLen, codeRe = false, index = 0, arrCode = [];
  target += '';
  str += '';
  if (!str) { return target + '===\'\''; }
  maxLen = Math.max(Math.floor(str.length / 3), 1);

  while (index < str.length) {
    partLen = Math.floor(Math.random() * Math.min(maxLen, str.length)) + 1;
    codePart = getCode4string(str.substr(index, partLen));
    arrCode.push(codeRe ?
      '(new RegExp(\'^[\\\\s\\\\S]{' + index + '}\'+(' +
        codePart + ').replace(/(\\W)/g,\'\\\\$1\'))).test(' + target + ')' :
      '(' + target + ').indexOf(' + codePart + ')===' + index
    );
    codeRe = !codeRe;
    index += partLen;
  }

  return arrCode.reverse().join('&&');
}

exports.mangle = function(source) {
  // var reLiteral = /^\s*(['"])[\s\S]*\1\s*$/,
  // `+` might be included.
  var reLiteral = /^\s*['"][\s\S]*['"]\s*$/,
    reMatch = /^\s*([\s\S]+?)\s*===?\s*(['"][\s\S]*['"])\s*$/;

  function getStringFromCode(code) {
    try {
      /* jshint evil:true */
      code = (new Function('return ' + code))();
      /* jshint evil:false */
    } catch (e) {
      throw new Error('Invalid code: ' + code);
    }
    return code;
  }

  return source.replace(/\/\*\s*@mangle\s*\*\/\s*([\s\S]+?)\s*\/\*\s*@\/mangle\s*\*\//g,
    function(s, content) {
      var matches;
      if (reLiteral.test(content)) {                    // ======== Literal
        return getCode4string(getStringFromCode(content));
      } else if ((matches = reMatch.exec(content))) {   // ======== Match
        return getCode4match(matches[1], getStringFromCode(matches[2]));
      } else {
        throw new Error('Invalid directive: ' + content);
      }
    });
};

exports.getCode = function(str) {
  return getCode4string(str);
};
