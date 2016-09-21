/**
 * @module lexer
 */

var Stream = require("./stream.js").Stream;

/** @todo Write tests for the regular expressions */
var tokenRegExps = {
  // In order of precedence (most specific -> least specific)

  // m[1] => level, m[2] => keyword, m[3] => priority, m[4] => content, m[5] tags
  "todo": /^(\*+)\s+(?:(\w+)\s*)(?:\s+\[#([ABCabc])\]\s*)?(?:\s(?!:[\w@#%:]*:)+(.*?))?(?:\s+(:[\w@#%:]*:)\s*)?$/,
  "header": /^(\*+)\s*(?:\s(?!:[\w@#%:]*:)+(.*?))?(?:\s+(:[\w@#%:]*:)\s*)?$/, // m[1] => level, m[2] => content, m[3] tags

  "preformatted": /^(\s*):(?: (.*)$|$)/, // m[1] => indentation, m[2] => content

  /** @todo rebuild this according to the org-mode syntax spec */
  // m[1] => indentation, m[2] => bullet (incl space before '*'), m[3] => checkbox, m[4] => term, m[5] => content
  "dictionaryListElement": /^(\s*)(-|\+|\s+\*|\d+[\.\)])(?:\s+\[( |X|-)\])?(?:\s+(.*?))?\s+::\s+(.*)$/,
  
  // m[1] => indentation, m[2] => bullet (incl space before '*'), m[3] => checkbox, m[4] => content 
  "listElement": /^(\s*)(-|\+|\s+\*|\d+[\.\)])(?:(?:\s+(?:\[( |X|-)\])?\s*(.*)$)|$)/,

  "blank": /^\s*$/,
  "horizontalRule": /^(\s*)-{5,}\s*$/, // m[1] => indentation
  "directive": /^(\s*)#\+(?:(begin|end)_)?(.*)$/i, // m[1] => indentation, m[2] => type, m[3] => content
  "comment": /^(\s*)#(.*)$/,
  "line": /^(\s*)(.*)$/,
}


if (exports) {
  exports.tokenRegExps = tokenRegExps;
}