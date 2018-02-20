/*
 * gnirts
 * https://github.com/anseki/gnirts
 *
 * Copyright (c) 2018 anseki
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
  '(function(){var @ID1@=Array.prototype.slice.call(arguments),@ID2@=@ID1@.shift();' +
    'return @ID1@.reverse().map(function(@ID3@,@ID4@){' +
    'return String.fromCharCode(@ID3@-@ID2@-@SHIFT2@-@ID4@)}).join(\'\')})(@ARGS@)',
/*
.split('').map(function(char) {
  return String.fromCharCode(char.charCodeAt() + (@OFFSET@));
}).join('')
*/
  TPL_OFFSET = '.split(\'\').map(function(@ID1@){' +
    'return String.fromCharCode(@ID1@.charCodeAt()+(@OFFSET@))}).join(\'\')',

  reR36 = new RegExp('([0-9a-z]{1,' + MAX_LEN_R36 + '})' +
    R36_BLOCKS_TABLE.map(function(block) {
      return '|(' + block.pattern + '{1,' + MAX_LEN_R36 + '})';
    }).join('') + '|([^\\x00-\\x7f]+)'/* invalid */, 'g'),
  tryR36 = false;

function getIdPicker() {
  var ids = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
    'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  return function() {
    // This error means that a bug exists in the caller. (picker should not be used over 52 times.)
    if (!ids.length) { throw new Error('getIdPicker'); }
    return (ids.splice(Math.floor(Math.random() * ids.length), 1))[0];
  };
}

function escapePattern(pattern) {
  return pattern.replace(/[\x00-\x7f]/g, // eslint-disable-line no-control-regex
    function(s) { return '\\x' + ('00' + s.charCodeAt().toString(16)).substr(-2); });
}

function getCode4string(str, tryCompact) {
  var reNonAscii = /[^\x00-\x7f]/, // eslint-disable-line no-control-regex
    maxLen, strPart, partLen, arrCode = [];

  function getCodeWithCharCode(str) {
    var shift1 = Math.floor(Math.random() * 64), // 0..65
      shift2 = Math.floor(Math.random() * 64), // 0..65
      index = str.length, args = [],
      code = TPL_CHARCODE, idPicker = getIdPicker();

    while ((--index) > -1) {
      args.push(str.charCodeAt(index) + shift1 + shift2 + index);
    }
    args.unshift(shift1);

    return code.replace(/@SHIFT2@/g, shift2).replace(/@ARGS@/g, args.join(','))
      .replace(/@ID1@/g, idPicker()).replace(/@ID2@/g, idPicker())
      .replace(/@ID3@/g, idPicker()).replace(/@ID4@/g, idPicker());
  }

  function getCodeWithR36(str) {
    var matches, arrCode = [];

    function getCodeWithR36Unit(str) {
      var leadingZeros = '';
      str.replace(/^(0+)(?=.)/, function(s, zeros) {
        leadingZeros = '\'' + zeros + '\'+';
        return '';
      });
      return leadingZeros + '(' + parseInt(str, 36) + ').toString(36).toLowerCase()';
    }

    function checkBlock(block, i) {
      var code, idPicker;
      if (matches[i + 2]) {
        code = TPL_OFFSET;
        idPicker = getIdPicker();
        arrCode.push(
          getCodeWithR36Unit(
            matches[i + 2].split('').map(function(chr) {
              return String.fromCharCode(chr.charCodeAt() - block.offset);
            }).join('')
          ) +
          code.replace(/@OFFSET@/g, block.offset).replace(/@ID1@/g, idPicker())
        );
        return true;
      }
      return false;
    }

    while ((matches = reR36.exec(str))) {
      if (matches[1]) { // no offset
        arrCode.push(getCodeWithR36Unit(matches[1]));
      } else if (!R36_BLOCKS_TABLE.some(checkBlock) &&
          matches[R36_BLOCKS_TABLE.length + 2]) {
        // This error means that a bug exists in the caller. (reNonAscii already checked it.)
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
  target += '';
  str += '';
  if (!str) { return target + '===\'\''; }
  maxLen = Math.max(Math.floor(str.length / 2), 1);

  while (index < str.length) {
    partLen = Math.floor(Math.random() * Math.min(maxLen, str.length)) + 1;
    arrCode.push(codeRe ?
      '(new RegExp(\'^[^]{' + index + '}\'+' +
        getCode4string(escapePattern(str.substr(index, partLen)), true) +
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
    SP = '[^\\S\\n\\r]', // except line-break from \s
    QUOT_CAP = '([\'"][^]*[\'"])', // Not strict like `([\'"])...\\1` because directive catches code
    CNJ_LIT_CAP = '(' + // Conjunctions in literal pattern
      ['(', ')', '+', ',', ':', ';', '=', '?', '[', ']', '{', '}']
        .map(escapePattern).join('|') + ')',
    CNJ_MAT_CAP = '(' + // Conjunctions in match pattern
      ['&&', '||', '(', ')', ',', ':', ';', '=', '?', '[', ']', '{', '}']
        .map(escapePattern).join('|') + ')',

    reDir = new RegExp(
      // start
      '(?:' +
        '/\\*\\s*@mangle\\s*\\*/' +
        '|//' + SP + '*@mangle' + SP + '*\\r?\\n' +
      ')\\s*' +
      // content
      '([^]+?)' +
      // end
      '\\s*(?:' +
        '/\\*\\s*@/mangle\\s*\\*/' +
        '|//' + SP + '*@/mangle' + SP + '*(?=\\r?\\n|$)' +
      ')',
      'g'),
    reLiteral = new RegExp('^\\s*' + CNJ_LIT_CAP + '?\\s*' + QUOT_CAP + '\\s*' + CNJ_LIT_CAP + '?\\s*$'),
    reMatch = new RegExp('^\\s*' + CNJ_MAT_CAP + '?\\s*(\\S[^]*?)\\s*(\\!==?|===?)\\s*' +
      QUOT_CAP + '\\s*' + CNJ_MAT_CAP + '?\\s*$');

  function getStringFromCode(code) {
    try {
      code = (new Function('return ' + code))(); // eslint-disable-line no-new-func
    } catch (e) {
      throw new Error(e + '\nInvalid code: ' + code);
    }
    return code;
  }

  return source.replace(reDir, function(s, content) {
    var matches, code;
    content = content.replace(/\/\*[^]*?\*\//g, '').replace(/\/\/.*/g, '');
    if ((matches = reLiteral.exec(content))) {        // ======== Literal
      // matches 1:left-CNJ, 2:QUOT-string, 3:right-CNJ
      return (matches[1] || '') +
        getCode4string(getStringFromCode(matches[2])) + (matches[3] || '');
    } else if ((matches = reMatch.exec(content))) {   // ======== Match
      // matches 1:left-CNJ, 2:target, 3:comparison-OP, 4:QUOT-string, 5:right-CNJ
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
