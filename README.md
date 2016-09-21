org-mode-js
======

**This project is in pre-alpha, and not yet ready for use.**

A JavaScript library for parsing and editing org-mode format (<http://orgmode.org/>). Compatible with NodeJS or with
the browser. No dependencies.

Org-mode-js was developed to be used as a backend for an org-mode-compatible hierarchical TODO list manager. Therefore,
it focuses on supporting all TODO item features. Many org-mode features are not yet supported.

Forked from <https://github.com/mooz/org-js> (under the MIT license), largely rewritten fresh but with lots of code
copied over from the org-js codebase.

Model
-----

Org-mode-js parses org-mode notation into a JSON-serializable tree of nodes. It retains the full text of the original document, and each node in the tree saves the bounding cursor positions within the orginal document. These two objects are wrapped in an OrgDocument object that knows how to edit individual nodes. When a node is edited, the text of the document is edited as well, but only within the bounding cursor positions. Thus, whitespace between nodes is left unchanged; only semantically valid edits are made.

**Everything below this point in the README is unchanged from before forking the code, and may be inaccurate. I have retained it for my own guidance, and will update it before releasing any usable versions.**

-------------------------------

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
