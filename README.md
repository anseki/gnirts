# gnirts

* [Grunt](http://gruntjs.com/) plugin: [grunt-gnirts](https://github.com/anseki/grunt-gnirts)
* [gulp](http://gulpjs.com/) plugin: [gulp-gnirts](https://github.com/anseki/gulp-gnirts)

Obfuscate string literals in JavaScript code.

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
var password = (function(){var m=Array.prototype.slice.call(arguments),i=m.shift();return m.reverse().map(function(j,a){return String.fromCharCode(j-i-55-a)}).join('')})(32,190,200,198)+(23).toString(36).toLowerCase()+(16).toString(36).toLowerCase().split('').map(function(Q){return String.fromCharCode(Q.charCodeAt()+(-71))}).join('')+(1022).toString(36).toLowerCase()+(function(){var m=Array.prototype.slice.call(arguments),Q=m.shift();return m.reverse().map(function(N,c){return String.fromCharCode(N-Q-16-c)}).join('')})(8,135,122,139)+(14).toString(36).toLowerCase();
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
if ((userInput).indexOf((function(){var l=Array.prototype.slice.call(arguments),O=l.shift();return l.reverse().map(function(P,g){return String.fromCharCode(P-O-3-g)}).join('')})(1,105),10)===10&&(new RegExp('^[\\s\\S]{9}'+(22).toString(36).toLowerCase())).test(userInput)&&(userInput).indexOf((function(){var J=Array.prototype.slice.call(arguments),z=J.shift();return J.reverse().map(function(H,d){return String.fromCharCode(H-z-47-d)}).join('')})(1,148,165,150,163),5)===5&&(new RegExp('^[\\s\\S]{2}'+(527).toString(36).toLowerCase()+(18).toString(36).toLowerCase().split('').map(function(w){return String.fromCharCode(w.charCodeAt()+(-13))}).join('')+(42840).toString(36).toLowerCase())).test(userInput)&&(userInput).indexOf((function(){var H=Array.prototype.slice.call(arguments),Y=H.shift();return H.reverse().map(function(u,U){return String.fromCharCode(u-Y-12-U)}).join('')})(59,184,182),0)===0) {
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
The replaced code differs depending on the inside code of the directive:

### String literal

The string literals like `'foo'`, `"foo"` or `'foo' + 'bar'` are replaced to the codes that return an original string.

For example:

```js
var password = /* @mangle */ 'open sesame' /* @/mangle */;
```

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
A comparison operator must be `===`, `==`, `!==` or `!=`.  
The string literal may be `'foo'`, `"foo"` or `'foo' + 'bar'`.

For example:

```js
if (/* @mangle */ userInput === 'open sesame' /* @/mangle */) {
  console.log('OK, the door will be opened.');
}
```

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

## Note

This mangling is not the cryptography to keep the data secure. It is used to avoid the hacking, the stealing something or the reverse engineering for such as the hybrid applications or the web applications. If your program uses the sensitive information such as the user's accounts, you should consider the standard secure system such as the cryptography by key pair.
