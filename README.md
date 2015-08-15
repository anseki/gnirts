# gnirts

Obfuscate the string literal in the JavaScript code.

gnirts mangles the string literal more than hexadecimal escape like `"\x66\x6f\x6f"`.  
That hexadecimal escape is found out too easily, and it is decoded too easily. That stands out in the code. The stealers get the secret text easily by pasting that on the console (e.g. Developer Tools of web browser).
gnirts can't protect the string perfectly, but it force a troublesome work upon them.

For example, a string that should be hidden is here:

```js
var password = 'open the sesame';
```

Add the directives:

```js
var password = /* @mangle */ 'open the sesame' /* @/mangle */;
```

The string literal between `/* @mangle */` and `/* @/mangle */` is obfuscated:

```js
var password = (function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-30-O)}).join('')})(12,155,145,155,153)+(16).toString(36).toLowerCase().split('').map(function(O){return String.fromCharCode(O.charCodeAt()+(-71))}).join('')+(38210).toString(36).toLowerCase()+(16).toString(36).toLowerCase().split('').map(function(O){return String.fromCharCode(O.charCodeAt()+(-71))}).join('')+(function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-37-O)}).join('')})(41,191,178,195,180,193)+(14).toString(36).toLowerCase();
```

But an above code is no good because a `password` variable can be shown by the debugger (e.g. Developer Tools of web browser).  
Using no variable is better way.  
For example, check whether an input from user is matched to a string literal:

```js
if (userInput === 'open the sesame') {
  console.log('OK, the door will be opened.');
}
```

Add the directives:

```js
if (/* @mangle */ userInput === 'open the sesame' /* @/mangle */) {
  console.log('OK, the door will be opened.');
}
```

The code between `/* @mangle */` and `/* @/mangle */` is obfuscated:

```js
if ((new RegExp('^[\\s\\S]{10}'+((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-62-O)}).join('')})(8,171)+(28).toString(36).toLowerCase()+(function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-26-O)}).join('')})(9,132)+(22).toString(36).toLowerCase()+(function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-8-O)}).join('')})(19,128)).replace(/(\W)/g,'\\$1'))).test(userInput)&&(userInput).indexOf((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-18-O)}).join('')})(13,135)+(14).toString(36).toLowerCase()+(function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-2-O)}).join('')})(25,59)+(28).toString(36).toLowerCase())===6&&(new RegExp('^[\\s\\S]{5}'+((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-3-O)}).join('')})(52,171)).replace(/(\W)/g,'\\$1'))).test(userInput)&&(userInput).indexOf((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-55-O)}).join('')})(44,209)+(16).toString(36).toLowerCase().split('').map(function(O){return String.fromCharCode(O.charCodeAt()+(-71))}).join(''))===3&&(new RegExp('^[\\s\\S]{2}'+((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-45-O)}).join('')})(7,153)).replace(/(\W)/g,'\\$1'))).test(userInput)&&(userInput).indexOf((function(){var O=Array.prototype.slice.call(arguments),l=O.shift();return O.reverse().map(function(c,O){return String.fromCharCode(c-l-33-O)}).join('')})(25,169)+(25).toString(36).toLowerCase())===0) {
  console.log('OK, the door will be opened.');
}
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

Mangle the strings literal and the codes that check matching between the directives `/* @mangle */` and `/* @/mangle */`, and return an obfuscated code.  
The replaced codes differ depending on the code between the directives:

* The strings literal like `'foo'`, `"foo"` or `'foo' + 'bar'` are replaced to the codes that return an original string.
* The condition codes like `SOMETHING === 'strings literal'` are replaced to the codes that return a boolean to indicate whether it matches. `SOMETHING` may be a variable, a reference to a string like `fooObject.barProperty` or a function that returns a string.  
Note that `SOMETHING` is referenced multiple times (i.e. if that is a function, that is called multiple times).  
A comparison operator must be `===` or `==`. The strings literal may be `'foo'`, `"foo"` or `'foo' + 'bar'`.

For example:

```js
var gnirts = require('gnirts'),
  fs = require('fs'),
  js;

js = fs.readFileSync('src.js', {encoding: 'utf8'});
js = gnirts.mangle(js);
fs.writeFileSync('dest.js', js);
```

`src.js`:

```js
if (/* @mangle */ userInput === 'open the sesame' /* @/mangle */) {
  console.log('OK, the door will be opened.');
}
```

### `getCode`

```js
stringCode = gnirts.getCode(stringValue)
```

Return a obfuscated code that returns a `stringValue`.
