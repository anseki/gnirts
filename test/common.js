'use strict';

const sinon = require('sinon'),
  random = sinon.stub(Math, 'random').returns(0.5),
  gnirts = require('../lib/gnirts');

let tryR36 = false;

exports.testCases = [
  {value: 'a', title: 'length: 1'},
  {value: 'ab', title: 'length: 2'},
  {value: 'abcdefghijklmnopqrstuvwxyz0123456789', title: 'length: 36'},
  {value: '\u4F60\u597D\u3053\u3093\u306B\u3061\u306F', title: 'Non-Ascii'},
  {value: '\x00\x09\x0a\x0d \x7f()$\'"\t', title: 'symbol and meta'},
  {value: '\u4F60\u597D\u3053\u3093\u306B\u3061\u306Fabc\x00\x09\x0a\x0d \x7f()$\'"\t123', title: 'mixed'}
];

exports.RE_CHARCODE = '\\(function\\(\\)\\{var \\w+=Array\\.prototype\\.slice\\.call\\(arguments\\),' +
  '\\w+=\\w+\\.shift\\(\\);return \\w+\\.reverse\\(\\)\\.map\\(function\\(\\w+,\\w+\\)' +
  '\\{return String\\.fromCharCode\\(\\w+-\\w+-\\w+-\\w+\\)\\}\\)\\.join\\(\'\'\\)\\}\\)\\([^\\)]+\\)';
exports.RE_R36 = '(?:\'0+\'\\+)?\\([^\\)]+\\)\\.toString\\(36\\)\\.toLowerCase\\(\\)' +
  '(?:\\.split\\(\'\'\\)\\.map\\(function\\(\\w+\\)\\{return String\\.fromCharCode\\(' +
  '\\w+\\.charCodeAt\\(\\)\\+\\([\\d\\-]+\\)\\)\\}\\)\\.join\\(\'\'\\))?';

exports.getPattern4string = forceTryR36 => {
  if (typeof forceTryR36 === 'boolean') { tryR36 = forceTryR36; }
  const res = tryR36 ? exports.RE_R36 : exports.RE_CHARCODE;
  tryR36 = !tryR36;
  return res;
};

// Fix state of common#tryR36 for gnirts#tryR36
// After stub.returns() (common.random.returns()) was called
exports.fixTryR36 = () => {
  if (!(new RegExp(`^${exports.getPattern4string()}$`)).test(gnirts.getCode('a'))) {
    tryR36 = !tryR36; // Toggle
  }
};

// Consider `target` `\w+`
exports.RE_CODERE = '\\(new RegExp\\(\'\\^\\[\\^\\]\\{[\\d\\-]+\\}\'\\+GETCODE4STRING\\)\\)\\.test\\(\\w+\\)';
exports.RE_INDEXOF = '\\(\\w+\\)\\.indexOf\\(GETCODE4STRING,[\\d\\-]+\\)===[\\d\\-]+';

exports.getPattern4match = len => {
  const arrCode = [];
  let codeRe = false,
    i;
  for (i = 0; i < len; i++) {
    arrCode.push((codeRe ? exports.RE_CODERE : exports.RE_INDEXOF)
      .replace(/GETCODE4STRING/,
        (codeRe ? `(${exports.getPattern4string()}\\+?)+` : // The length is expanded by escapePattern
        exports.getPattern4string())));
    codeRe = !codeRe;
  }
  return `^${arrCode.reverse().join('&&')}$`;
};

exports.code2str = code => (new Function('return ' + code))(); // eslint-disable-line no-new-func

exports.random = random;
