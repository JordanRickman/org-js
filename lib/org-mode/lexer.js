/**
 * @module lexer
 */

var Stream = require("./stream.js").Stream;

var tokenRegExps = {
  // In order of precedence (most specific -> least specific)

  // m[1] => level, m[2] => keyword, m[3] => priority, m[4] => content, m[5] tags
  "todo": /^(\*+)\s+(?:(\w+)\s*)(?:\s+\[#([ABCabc])\]\s*)?(?:\s(?!:[\w@#%:]*:)+(.*?))?(?:\s+(:[\w@#%:]*:)\s*)?$/,
  "header": /^(\*+)\s*(?:\s(?!:[\w@#%:]*:)+(.*?))?(?:\s+(:[\w@#%:]*:)\s*)?$/, // m[1] => level, m[2] => content, m[3] tags

  // m[1] => indentation, m[2] => bullet (incl space before '*'), m[3] => checkbox, m[4] => term, m[5] => content
  "dictionaryListElement": /^(\s*)(-|\+|\s+\*|\d+[\.\)])(?:\s+\[( |X|-)\])?(?:\s+(.*?))?\s+::\s+(.*)$/,
  
  // m[1] => indentation, m[2] => bullet (incl space before '*'), m[3] => checkbox, m[4] => content 
  "listElement": /^(\s*)(-|\+|\s+\*|\d+[\.\)])(?:(?:\s+(?:\[( |X|-)\])?\s*(.*)$)|$)/,

  "beginDrawer": /^(\s*):([\w-]*):\s*$/, // m[1] => indentation, m[2] => content
  "endDrawer": /^(\s*):END:\s*$/, // m[1] => indentation

  /** @todo Unit test the block, dynamic block, and directive patterns. */
  "beginBlock": /^(\s*)#\+BEGIN_(\S*)(?:\s+(.*)$|$)/, // m[1] => indentation, m[2] => name, m[3] => content (params)
  "endBlock": /^(\s*)#\+END_(\S*)\s*$/, // m[1] => indentation, m[2] => name

  "beginDynamicBlock": /^(\s*)#\+BEGIN:\s+(\S*)(?:\s+(.*)$|$)/, // m[1] => indentation, m[2] => name, m[3] => content (params)
  "endDynamicBlock": /^(\s*)#\+END:\s*$/, // m[1] => indentation

  "directive": /^(\s*)#\+(\S*):(?:\s+(.*)$|$)/, // m[1] => indentation, m[2] => name, m[3] => content (params)

  "preformatted": /^(\s*):(?:\s(.*)$|$)/, // m[1] => indentation, m[2] => content
  "blank": /^\s*$/,
  "horizontalRule": /^(\s*)-{5,}\s*$/, // m[1] => indentation
  "comment": /^(\s*)#(?:([^\+].*)$|$)/, // m[1] => indentation, m[2] => content
  "line": /^(\s*)(.*)$/, // m[1] => indentation, m[2] => content
}


/**
 * @typedef {Object} LineToken
 * A token representing a single line of the stream.
 *
 * @property {string} type - The type of line. Each possible value corresponds to a regex in {@link tokenRegExps}.
 * @property {number} lineNumber - The line number of the line in the source stream.
 * @property {string} raw - The full text of the line.
 * @property {number} indent - How many spaces the line is indented by.
 *   A note on tabs:
 *    If the convertTabs option is enabled, the lexer will convert tabs to spaces according to the tabWidth option.
 *    Otherwise, tab characters are treated as a single space width. This means mixing spaces and tabs can be 
 *    confusing, but that using all tab characters for indentation will work as expected.
 *    All other non-newline whitespace characters will be treated as a single space width. Special control characters
 *    (e.g. backspace) are not handled, but act like a single space.
 * @property {string} content - The main content of the line (excludes indentation).
 *    Certain other content will also be excluded and possibly stored in other properties, depending on token type.
 *    For details, see the comments in the source for {@link tokenRegExps} and the typedefs for each LineToken subtypes.
 */

/**
 * @class {LineToken}
 * @param {string} type - The type of line.
 * @param {number} lineNumber - The line number of the line in the source stream.
 * @param {string} raw - The full text of the line.
 * @param {number} indent - How many spaces the line is indented by.
 * @param {string} content - The main content of the line (excludes indentation).
 */
function LineToken(type, lineNumber, raw, indent, content) {
  this.type = type;
  this.lineNumber = lineNumber;
  this.raw = raw;
  this.indent = indent;
  this.content = content;
}


/**
 * @typedef {LineToken} HeaderToken
 * A LineToken representing a header.
 *
 * @property {number} level - The depth of the header, starting at 1. I.E. the number of preceding asterisks.
 * @property {string[]} tags - The tags assigned to this header.
 */

/**
 * @class {HeaderToken}
 * @param {number} lineNumber - The line number of the line in the source stream.
 * @param {string} raw - The full text of the line.
 * @param {number} level - The depth of the header, starting at 1.
 * @param {string} content - The main content of the header (excludes asterisks, tags, and the whitespace around them).
 * @param {string[]} tags - The tags assigned to this header.
 */
function HeaderToken(lineNumber, raw, level, content, tags) {
  LineToken.call(this, 'header', lineNumber, raw, 0, content);
  this.level = level;
  this.tags = [];
  if (tags) {
    for (var i = 0; i < tags.length; i++) {
      this.tags.push(tags[i]);
    }
  }
}

/**
 * @typedef {HeaderToken} TodoToken
 * A LineToken representing a TODO item. Extends and decorates HeaderToken.
 * TODO items are also headers, and the only way to distinguish between them is to check the list of TODO keywords.
 * This occurs at the parser level. Therefore, the lexer aggressively matches TODO items, but matches each TODO item
 * as a header as well, and stores the result as a nested token in the TodoToken.
 * If the TODO keyword is not in the list, the parser uses the nested HeaderToken instead.
 * 
 * @property {string} keyword - The TODO keyword.
 * @property {'A'|'B'|'C'} priority - The priority level (one of A, B, or C). The lexer will convert lower to uppercase.
 * @property {HeaderToken} headerVersion - The same line matched as a header line instead of a TODO item.
 */

/**
 * @class {TodoToken}
 * @param {number} lineNumber - The line number of the line in the source stream.
 * @param {string} raw - The full text of the line.
 * @param {number} level - The depth of the TODO item, starting at 1.
 * @param {string} content - The main content of the item (excludes asterisks, keyword, priority, tags, and the whitespace around them).
 * @param {string[]} tags - The tags assigned to this item.
 * @param {string} keyword - The TODO keyword.
 * @param {'A'|'B'|'C'} priority - The priority level.
 * @param {HeaderToken} headerVersion - The same line matched as a header line instead of a TODO item.
 */
function TodoToken(lineNumber, raw, level, content, tags, keyword, priority, headerVersion) {
  HeaderToken.call(this, lineNumber, raw, level, content, tags);
  this.type = 'todo'; // Overwrite value set by HeaderToken constructor
  this.keyword = keyword;
  this.priority = priority;
  this.headerVersion = headerVersion;
}


/**
 * @typedef {LineToken} ListElementToken
 * A LineToken representing an element of a list.
 *
 * A note on indentation: List elements may be marked with *, provided they are indented by at least one space.
 * Due to the limitations of regular expression, we must match the space before the * in the same capture group as the
 * bullet or number. Therefore, the lexer is responsible for including this extra space in the indentation count in the
 * case of a list element that uses * as its bullet.
 *
 * @property {boolean} isNumbered - Is this a numbered (true) or unordered (false) list element?
 * @property {boolean} hasCheckbox - Does this list item have a checkbox?
 * @property {' '|'X'|'-'|null} checkboxValue - The value in the checkbox, or null if no checkbox.
 *    Represents a 3-value todo sequence: incomplete (' '), done ('X'), or partly done ('-').
 *    Partly done is meant to be used with checkboxes in nested lists.
 */

/**
 * @class {ListElementToken}
 * @param {number} lineNumber - The line number of the line in the source stream.
 * @param {string} raw - The full text of the line.
 * @param {number} indent - How many spaces the list item is indented by.
 * @param {string} content - The main content of the list item (excludes indentation, bullet/number, checkbox, and the whitespace around them).
 * @param {boolean} isNumbered - Is this a numbered (true) or unordered (false) list element?
 * @param {' '|'X'|'-'|null} checkboxValue - The value in the checkbox, or null if no checkbox.
 */
function ListElementToken(lineNumber, raw, indent, content, isNumbered, checkboxValue) {
  LineToken.call(this, lineNumber, 'listElement', indent, content);
  this.isNumbered;
  if (checkboxValue === null)
    this.hasCheckbox = false;
  else
    this.hasCheckbox = true;
  this.checkboxValue = checkboxValue;
}


/**
 * @typedef {ListElementToken} DictElementToken
 * Extends ListElementToken for items in a description/dictionary list.
 *
 * @property {string} term - The name of the term being defined.
 */

/**
 * @class {DictElementToken}
 * @param {number} lineNumber - The line number of the line in the source stream.
 * @param {string} raw - The full text of the line.
 * @param {number} indent - How many spaces the list item is indented by.
 * @param {string} content - The main content of the list item (excludes indentation, bullet/number, checkbox, term, term separator, and the whitespace around them).
 * @param {boolean} isNumbered - Is this a numbered (true) or unordered (false) list element?
 * @param {' '|'X'|'-'|null} checkboxValue - The value in the checkbox, or null if no checkbox.
 * @param {string} term - The name of the term being defined.
 */
function DictElementToken(lineNumber, raw, indent, content, isNumbered, checkboxValue, term) {
  ListElementToken.call(this, lineNumber, raw, indent, content, isNumbered, checkboxValue);
  this.type = 'dictionaryListElement'; // Overwrite the type set by the ListElementToken constructor.
  this.term = term;
}


/**
 * @typedef {LineToken} DirectiveToken
 * A LineToken for directives with names - types 'beginBlock', 'endBlock', 'beginDynamicBlock', and 'directive'.
 *
 * @property {string} name - The name of the directive or dynamic block. For (non-dynamic) blocks, excludes BEGIN_/END_.
 */

/**
 * @class {DirectiveToken}
 * @param {string} type - The type of line.
 * @param {number} lineNumber - The line number of the line in the source stream.
 * @param {string} raw - The full text of the line.
 * @param {number} indent - How many spaces the line is indented by.
 * @param {string} content - The full text of the parameters passed to the directive, block, or dynamic block. For 'endBlock' tokens, the empty string.
 * @param {string} name - The directive, block, or dynamic block name.
 */
function DirectiveToken(type, lineNumber, raw, indent, content, name) {
  LineToken.call(this, type, lineNumber, raw, indent, content);
  this.nme = name;
}


/** We don't export the various LineToken constructors, because they have too little logic to bother unit testing them. */
if (exports) {
  exports.tokenRegExps = tokenRegExps;
}