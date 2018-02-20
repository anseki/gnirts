# gnirts

[![npm](https://img.shields.io/npm/v/gnirts.svg)](https://www.npmjs.com/package/gnirts) [![GitHub issues](https://img.shields.io/github/issues/anseki/gnirts.svg)](https://github.com/anseki/gnirts/issues) [![dependencies](https://img.shields.io/badge/dependencies-No%20dependency-brightgreen.svg)](package.json) [![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE-MIT)

* [Grunt](http://gruntjs.com/) plugin: [grunt-gnirts](https://github.com/anseki/grunt-gnirts)
* [gulp](http://gulpjs.com/) plugin: [gulp-gnirts](https://github.com/anseki/gulp-gnirts)
* [webpack](https://webpack.js.org/) loader: [gnirts-loader](https://github.com/anseki/gnirts-loader)

Obfuscate string literals in JavaScript code.

**<a href="https://anseki.github.io/gnirts/">Online Demonstration https://anseki.github.io/gnirts/</a>**

gnirts mangles string literals more than hexadecimal escape like `"\x66\x6f\x6f"`.  
String literals that were escaped by the hexadecimal escape can be found out too easily, and those can be decoded too easily. Those stand out in the code. Stealers can get secret text (e.g. password) easily by pasting that on a console (e.g. Developer Tools of web browser).

gnirts mangles string literals by using some codes instead of hexadecimal escape. gnirts might not be able to protect the string from stealers perfectly, but it forces a troublesome work upon them. (See [Note](#note).)

For example, a string that should be hidden is here:

```js
var password = 'open sesame';
```

Add the directives:

```js
var password = /* @mangle */ 'open sesame' /* @/mangle */;
```

And then, pass this code to gnirts. The string literal between `/* @mangle */` and `/* @/mangle */` is obfuscated:

```js
var password = (function(){var v=Array.prototype.slice.call(arguments),V=v.
shift();return v.reverse().map(function(U,o){return String.fromCharCode(U-V-0-o)
}).join('')})(6,119,117)+(527).toString(36).toLowerCase()+(function(){var N=
Array.prototype.slice.call(arguments),O=N.shift();return N.reverse().map(
function(R,T){return String.fromCharCode(R-O-41-T)}).join('')})(36,193,109)+(532
).toString(36).toLowerCase()+(function(){var R=Array.prototype.slice.call(
arguments),E=R.shift();return R.reverse().map(function(g,v){return String.
fromCharCode(g-E-62-v)}).join('')})(52,224,211)+(14).toString(36).toLowerCase();
```

(For this document, line-breaks were added to the code above.)

However, the code above is no good because the `password` variable can be shown by the debugger (e.g. Developer Tools of web browser).  
Therefore, using no variable is better way. And gnirts supports the checking that the string matches.  
For example, check whether an input from user is matched to a string literal:

```js
if (userInput === 'open sesame') {
  console.log('OK, the door will be opened.');
}
```

Add the directives (Note that all of the condition expression is included in the directive):

```js
if (/* @mangle */ userInput === 'open sesame' /* @/mangle */) {
  console.log('OK, the door will be opened.');
}
```

And then, pass this code to gnirts. The condition expression between `/* @mangle */` and `/* @/mangle */` is obfuscated:

```js
if ((userInput).indexOf((function(){var f=Array.prototype.slice.call(arguments),
L=f.shift();return f.reverse().map(function(U,d){return String.fromCharCode(U-L-
54-d)}).join('')})(43,200,207,194),8)===8&&(new RegExp('^[^]{5}'+(18).toString(
36).toLowerCase().split('').map(function(p){return String.fromCharCode(p.
charCodeAt()+(-13))}).join('')+(43023).toString(36).toLowerCase()+(18).toString(
36).toLowerCase().split('').map(function(u){return String.fromCharCode(u.
charCodeAt()+(-13))}).join('')+(42989).toString(36).toLowerCase()+(18).toString(
36).toLowerCase().split('').map(function(S){return String.fromCharCode(S.
charCodeAt()+(-13))}).join('')+(43023).toString(36).toLowerCase())).test(
userInput)&&(userInput).indexOf((function(){var I=Array.prototype.slice.call(
arguments),s=I.shift();return I.reverse().map(function(E,t){return String.
fromCharCode(E-s-8-t)}).join('')})(38,82,159,149,159,157),0)===0) {
  console.log('OK, the door will be opened.');
}
```

(For this document, line-breaks were added to the code above.)

## Directive

2 styles of the directive are supported:

```js
/* @mangle */ TARGET_CODE /* @/mangle */
```

```js
// @mangle
TARGET_CODE
// @/mangle
```

`TARGET_CODE`s are string literal or condition expression.

The comments in the target code are ignored.

```js
/* @mangle */ 'open' + /* Color: */' black' + ' sesame' /* @/mangle */
```

```js
// @mangle
'open' +
// Color of sesame is here:
' black' +
' sesame'
// @/mangle
```

The target code in the directive are replaced to obfuscated codes.  
The replaced code differs depending on the inside code of the directive:

### String literal

The string literals like `'foo'`, `"foo"` or `'foo' + 'bar'` are replaced to the codes that return an original string.

For example:

```js
var password = /* @mangle */ 'open sesame' /* @/mangle */;
```

The following strings at the left side and the right side of the string literal are copied to the same position of the replaced code:

- `(`, `)`, `+`, `,`, `:`, `;`, `=`, `?`, `[`, `]`, `{`, `}`

For example:

```js
password =
  'open' +
  // @mangle
  ' white' +
  ' sesame' + // <- This `+` is copied.
  // @/mangle
  ' street';
```

```js
data = {
  password:
    // @mangle
    'open sesame', // <- This `,` is copied.
    // @/mangle
  userName: 'Ali Baba'
};
```

### Condition expression

The condition expressions like `SOMETHING === 'string literal'` are replaced to the codes that return a boolean to indicate whether it matches.  
`SOMETHING` may be a variable, a reference to a string like `fooObject.barProperty` or a function that returns a string. Note that `SOMETHING` may be referenced multiple times (i.e. if that is a function, that is called multiple times).  
A comparison operator must be `===`, `==`, `!==` or `!=`.  
The string literal may be `'foo'`, `"foo"` or `'foo' + 'bar'`.

For example:

```js
if (/* @mangle */ userInput === 'open sesame' /* @/mangle */) {
  console.log('OK, the door will be opened.');
}
```

The following strings at the left side and the right side of the condition expression are copied to the same position of the replaced code:

- `&&`, `||`, `(`, `)`, `,`, `:`, `;`, `=`, `?`, `[`, `]`, `{`, `}`

For example:

```js
if (userName === 'Ali Baba' &&
    // @mangle
    userInput === 'open sesame' && // <- This `&&` is copied.
    // @/mangle
    cave.hasTreasure) {
  console.log('OK, the door will be opened.');
}
```

```js
var message =
  // @mangle
  userInput === 'open sesame' ? // <- This `?` is copied.
  // @/mangle
  'OK' :
  'NO';
```

## Installation

```shell
npm install gnirts
```

## Methods

### `mangle`

```js
obfuscatedCode = gnirts.mangle(sourceCode)
```

Parse and mangle `sourceCode`, and return an obfuscated code.

For example:

```js
var gnirts = require('gnirts'),
  fs = require('fs'),
  js;

js = fs.readFileSync('src.js', {encoding: 'utf8'});
js = gnirts.mangle(js);
fs.writeFileSync('dest.js', js);
```

### `getCode`

```js
stringCode = gnirts.getCode(stringValue)
```

Return a obfuscated code that returns a `stringValue`.

## Note

This mangling is not the cryptography to keep the data secure. It is used to avoid the hacking, the stealing something or the reverse engineering for such as the hybrid applications or the web applications. If your program uses the sensitive information such as the user's accounts, you should consider the standard secure system such as the cryptography by key pair.
