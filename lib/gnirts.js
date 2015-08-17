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
    }).join('') + '|([^\\x00-\\x7f]+)'/* invalid */, 'g'),
  tryR36 = false;

function getCode4string(str, tryCompact) {
  var reNonAscii = /[^\x00-\x7f]/,
    maxLen, strPart, partLen, arrCode = [];

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
      if (matches[1]) { // no offset
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
  if (!tryCompact) { maxLen = Math.max(Math.floor(str.length / 2), 1); }

  while (str) {
    if (tryCompact) {
      strPart = str;
      str = '';
    } else {
      partLen = Math.floor(Math.random() * Math.min(maxLen, str.length)) + 1;
      strPart = str.substr(0, partLen);
      str = str.substr(partLen);
    }
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
  var maxLen, partLen, codeRe = false, index = 0, arrCode = [];

  function escapeMeta(str) { // `\W` in a byte
    return str.replace(/([\x00-\x2f\x3a-\x40\x5b-\x5e\x60\x7b-\x7f])/g,
      function(s, meta) {
        return '\\x' + ('00' + meta.charCodeAt().toString(16)).substr(-2);
      });
  }

  target += '';
  str += '';
  if (!str) { return target + '===\'\''; }
  maxLen = Math.max(Math.floor(str.length / 2), 1);

  while (index < str.length) {
    partLen = Math.floor(Math.random() * Math.min(maxLen, str.length)) + 1;
    arrCode.push(codeRe ?
      '(new RegExp(\'^[\\\\s\\\\S]{' + index + '}\'+' +
        getCode4string(escapeMeta(str.substr(index, partLen)), true) +
        ')).test(' + target + ')' :
      '(' + target + ').indexOf(' +
        getCode4string(str.substr(index, partLen), true) + ',' + index + ')===' + index
    );
    codeRe = !codeRe;
    index += partLen;
  }

  return arrCode.reverse().join('&&');
}

exports.mangle = function(source) {
  var
    reDir = new RegExp(
      // start
      '(?:' +
        '/\\*\\s*@mangle\\s*\\*/' +
        '|//[^\\S\\n\\r]*@mangle[^\\S\\n\\r]*\\r?\\n' +
      ')\\s*' +
      // content
      '([\\s\\S]+?)' +
      // end
      '\\s*(?:' +
        '/\\*\\s*@/mangle\\s*\\*/' +
        '|//[^\\S\\n\\r]*@/mangle[^\\S\\n\\r]*(?=\\r?\\n|$)' +
      ')',
      'g'),
    reLiteral = /^\s*(\+\s*)?(['"][\s\S]*['"])(\s*\+)?\s*$/,
    reMatch = /^\s*((?:&&|\|\|)\s*)?([\s\S]+?)\s*(\!==?|===?)\s*(['"][\s\S]*['"])(\s*(?:&&|\|\||\?))?\s*$/;

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

  return source.replace(reDir, function(s, content) {
    var matches, code;
    content = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
    if ((matches = reLiteral.exec(content))) {        // ======== Literal
      // matches 1:leftOp, 2:str, 3:rightOp
      return (matches[1] || '') +
        getCode4string(getStringFromCode(matches[2])) + (matches[3] || '');
    } else if ((matches = reMatch.exec(content))) {   // ======== Match
      // matches 1:leftOp, 2:target, 3:comparisonOp, 4:str, 5:rightOp
      code = getCode4match(matches[2], getStringFromCode(matches[4]));
      if (matches[3].substr(0, 1) === '!') { code = '!(' + code + ')'; }
      return (matches[1] || '') + code + (matches[5] || '');
    } else {
      throw new Error('Invalid directive: ' + content);
    }
  });
};

exports.getCode = function(str) {
  return getCode4string(str);
};
