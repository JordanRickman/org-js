org-js
======

Parser for org-mode (<http://orgmode.org/>) notation written in JavaScript. Also provides conversion to HTML (extendable with other converter classes). Forked from https://github.com/mooz/org-js (under the MIT license), modified with additional features, particularly richer parsing of TODOs.

Interactive Editor
------------------

For working example, see http://mooz.github.com/org-js/editor/.
**TODO Copy mooz's example into own working example.**

Installation
------------

    npm install org

Simple example of org -> HTML conversion
----------------------------------------

```javascript
var org = require("org");

var parser = new org.Parser();
var orgDocument = parser.parse(orgCode);
var orgHTMLDocument = orgDocument.convert(org.ConverterHTML, {
  headerOffset: 1,
  exportFromLineNumber: false,
  suppressSubScriptHandling: false,
  suppressAutoLink: false
});

console.dir(orgHTMLDocument); // => { title, contentHTML, tocHTML, toc }
console.log(orgHTMLDocument.toString()) // => Rendered HTML
```

Writing yet another converter
-----------------------------

See `lib/org/converter/html.js`.
