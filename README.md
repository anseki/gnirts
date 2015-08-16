# gnirts

* [Grunt](http://gruntjs.com/) plugin: [grunt-gnirts](https://github.com/anseki/grunt-gnirts)
* [gulp](http://gulpjs.com/) plugin: [gulp-gnirts](https://github.com/anseki/gulp-gnirts)

Obfuscate the string literal in the JavaScript code.

gnirts mangles the string literal more than hexadecimal escape like `"\x66\x6f\x6f"`.  
That hexadecimal escape is found out too easily, and it is decoded too easily. That stands out in the code. The stealers get the secret text (e.g. password) easily by pasting that on the console (e.g. Developer Tools of web browser).

gnirts mangles the string literal by using some codes instead of hexadecimal escape. gnirts might not be able to protect the string from the stealers perfectly, but it forces a troublesome work upon them.

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
var password = (function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-35-O)}).join('')})(12,150,160,158)+(23).toString(36).toLowerCase()+(16).toString(36).toLowerCase().split('').map(function(O){return String.fromCharCode(O.charCodeAt()+(-71))}).join('')+(function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-33-O)}).join('')})(54,189,202)+(1018).toString(36).toLowerCase()+(function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-3-O)}).join('')})(30,142)+(14).toString(36).toLowerCase();
```

But an above code is no good because a `password` variable can be shown by the debugger (e.g. Developer Tools of web browser).  
Using no variable is better way. And gnirts supports the checking that the string matches.  
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
if ((userInput).indexOf((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-41-O)}).join('')})(3,153)+(14).toString(36).toLowerCase(),9)===9&&(new RegExp('^[\\s\\S]{7}'+((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-18-O)}).join('')})(10,143)+(10).toString(36).toLowerCase()).replace(/([\x00-\x2f\x3a-\x40\x5b-\x5e\x60\x7b-\x7f])/g,function(s,I){return '\\x'+('00'+I.charCodeAt().toString(16)).substr(-2)}))).test(userInput)&&(userInput).indexOf((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-45-O)}).join('')})(59,205),6)===6&&(new RegExp('^[\\s\\S]{3}'+((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-46-O)}).join('')})(55,211)+(16).toString(36).toLowerCase().split('').map(function(O){return String.fromCharCode(O.charCodeAt()+(-71))}).join('')+(function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-29-O)}).join('')})(46,190)).replace(/([\x00-\x2f\x3a-\x40\x5b-\x5e\x60\x7b-\x7f])/g,function(s,I){return '\\x'+('00'+I.charCodeAt().toString(16)).substr(-2)}))).test(userInput)&&(userInput).indexOf((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-45-O)}).join('')})(48,194),2)===2&&(new RegExp('^[\\s\\S]{1}'+((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-11-O)}).join('')})(34,157)).replace(/([\x00-\x2f\x3a-\x40\x5b-\x5e\x60\x7b-\x7f])/g,function(s,I){return '\\x'+('00'+I.charCodeAt().toString(16)).substr(-2)}))).test(userInput)&&(userInput).indexOf((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-37-O)}).join('')})(24,172),0)===0) {
  console.log('OK, the door will be opened.');
}
```

## Directive

2 styles of the directive are supported:

```js
/* @mangle */ 'string literal' /* @/mangle */
```

```js
// @mangle
'string literal'
// @/mangle
```

The comments are ignored.

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

The inside codes of the directives are replaced to obfuscated codes.  
The replaced code differs depending on the inside codes of the directive:

### String literal

The string literals like `'foo'`, `"foo"` or `'foo' + 'bar'` are replaced to the codes that return an original string.

The `+` operators that are left side and right side of the string literal are copied to same position of the replaced code.

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

### Condition expression

The condition expressions like `SOMETHING === 'string literal'` are replaced to the codes that return a boolean to indicate whether it matches.  
`SOMETHING` may be a variable, a reference to a string like `fooObject.barProperty` or a function that returns a string. Note that `SOMETHING` may be referenced multiple times (i.e. if that is a function, that is called multiple times).  
A comparison operator must be `===` or `==`.  
The string literal may be `'foo'`, `"foo"` or `'foo' + 'bar'`.

The `&&` and `||` operators that are left side and right side of the condition expression, and the `?` operators that are right side of the condition expression are copied to same position of the replaced code.

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
