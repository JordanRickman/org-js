var assert = require('chai').assert;
var expect = require('chai').expect;

var lexer = require("../lib/org-mode/lexer");
var tokenRegExps = lexer.tokenRegExps;

describe('Token-matching Regular Expressions', function() {
  /*
   * RegExp.exec() results are arrays with additional properties.
   * These additional properties cause chai's deep equal() to return false when compared to a plain array.
   * I'm not sure if those additional properties are the same in every browser, so rather than re-create them,
   * I'm writing my own comparison function that ignores properties.
   * It also treats undefined, null, and the empty string as equivalent, because capture groups may sometimes
   * evaluate to undefined and sometimes to the empty string.
   */
  function regExpResultEquals(arr1, arr2) {
    if (arr1.length !== arr2.length)
      return false;
    for (var i = 0; i < arr1.length; i++) {
      if ((arr1[i] === "" || arr1[i] === undefined || arr1[i] === null) &&
        (arr2[i] === "" || arr2[i] === undefined || arr2[i] === null))
        break;
      if (arr1[i] !== arr2[i])
        return false;
    }
    return true;
  }

  it('should properly parse TODO items', function() {
    var todo = tokenRegExps['todo'];
    var execResult;

    var allComponents = "**  TODO  [#A]   Todo item content  :some:tags:@_#%:  ";
    execResult = todo.exec(allComponents);
    assert(regExpResultEquals(execResult, [allComponents, "**", "TODO", "A", "Todo item content", ":some:tags:@_#%:"]),
     "Failed on '"+allComponents+"', got:\n["+execResult+"]");

    var oneTag = "**  TODO  [#A]   Todo item content  :one_tag:  ";
    execResult = todo.exec(oneTag);
    assert(regExpResultEquals(execResult, [oneTag, "**", "TODO", "A", "Todo item content", ":one_tag:"]),
     "Failed on '"+oneTag+"', got:\n["+execResult+"]");

    var noPriority = "**  TODO     Todo item content  :some:tags:@_#%:  ";
    execResult = todo.exec(noPriority);
    assert(regExpResultEquals(execResult, [noPriority, "**", "TODO", "", "Todo item content", ":some:tags:@_#%:"]),
     "Failed on '"+noPriority+"', got:\n["+execResult+"]");

    var noContent = "**  TODO  [#A]     :some:tags:@_#%:  ";
    execResult = todo.exec(noContent);
    assert(regExpResultEquals(execResult, [noContent, "**", "TODO", "A", "", ":some:tags:@_#%:"]),
     "Failed on '"+noContent+"', got:\n["+execResult+"]");

    var noTags = "**  TODO  [#A]   Todo item content    ";
    execResult = todo.exec(noTags);
    assert(regExpResultEquals(execResult, [noTags, "**", "TODO", "A", "Todo item content    ", ""]),
     "Failed on '"+noTags+"', got:\n["+execResult+"]");

    var noPriorityNoContent = "**  TODO    :some:tags:@_#%:  ";
    execResult = todo.exec(noPriorityNoContent);
    assert(regExpResultEquals(execResult, [noPriorityNoContent, "**", "TODO", "", "", ":some:tags:@_#%:"]),
     "Failed on '"+noPriorityNoContent+"', got:\n["+execResult+"]");

    var noPriorityNoTags = "**  TODO  Todo item content    ";
    execResult = todo.exec(noPriorityNoTags);
    assert(regExpResultEquals(execResult, [noPriorityNoTags, "**", "TODO", "", "Todo item content    ", ""]),
     "Failed on '"+noPriorityNoTags+"', got:\n["+execResult+"]");

    var minimal = "*  TODO  ";
    execResult = todo.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "*", "TODO", "", "", ""]),
     "Failed on '"+minimal+"', got:\n["+execResult+"]");

    var lowercaseKeyword = "*  Lowercase_Keyword";
    execResult = todo.exec(lowercaseKeyword);
    assert(regExpResultEquals(execResult, [lowercaseKeyword, "*", "Lowercase_Keyword", "", "", ""]),
     "Failed on '"+lowercaseKeyword+"', got:\n["+execResult+"]");

    //----- Examples that are headers but not TODO Items; make sure they aren't matched -----
    var minimalHeader = "*  ";
    execResult = todo.exec(minimalHeader);
    assert(execResult === null,
     "Failed on '"+minimalHeader+"', got:\n["+execResult+"]");

    var minimalTaggedHeader = "*  :some:tags:@_#%:  ";
    execResult = todo.exec(minimalTaggedHeader);
    assert(execResult === null,
     "Failed on '"+minimalTaggedHeader+"', got:\n["+execResult+"]");

    var noKeyword = "**  [#A]   Todo item content  :some:tags:@_#%:  ";
    execResult = todo.exec(noKeyword);
    assert(execResult === null,
     "Failed on '"+noKeyword+"', got:\n["+execResult+"]");

    //----- Some examples that are neither a header nor a TODO item -----
    var noSpaceAfterStars = "**TODO [#A] Todo item content  :some:tags:@_#%:  ";
    execResult = todo.exec(noSpaceAfterStars);
    assert(execResult === null,
     "Failed on '"+noSpaceAfterStars+"', got:\n["+execResult+"]");

    var spaceBeforeStars = " ** TODO [#A] Todo item content  :some:tags:@_#%:  ";
    execResult = todo.exec(spaceBeforeStars);
    assert(execResult === null,
     "Failed on '"+spaceBeforeStars+"', got:\n["+execResult+"]");

    var badCharacterInStars = "*-* TODO [#A] Todo item content  :some:tags:@_#%:  ";
    execResult = todo.exec(badCharacterInStars);
    assert(execResult === null,
     "Failed on '"+badCharacterInStars+"', got:\n["+execResult+"]");

    var noStars = "  TODO [#A] Todo item content  :some:tags:@_#%:  ";
    execResult = todo.exec(noStars);
    assert(execResult === null,
     "Failed on '"+noStars+"', got:\n["+execResult+"]");
  });
  

  it('should properly parse headers', function() {
    var header = tokenRegExps['header'];
    var execResult;

    var allComponents = "**  Header content  :some:tags:@_#%:  ";
    execResult = header.exec(allComponents);
    assert(regExpResultEquals(execResult, [allComponents, "**", "Header content", ":some:tags:@_#%:"]),
     "Failed on '"+allComponents+"', got:\n["+execResult+"]");

    var oneTag = "**  Header content  :one_tag:  ";
    execResult = header.exec(oneTag);
    assert(regExpResultEquals(execResult, [oneTag, "**", "Header content", ":one_tag:"]),
     "Failed on '"+oneTag+"', got:\n["+execResult+"]");

    var tagsOnly = "**  :some:tags:@_#%:  ";
    execResult = header.exec(tagsOnly);
    assert(regExpResultEquals(execResult, [tagsOnly, "**", "", ":some:tags:@_#%:"]),
     "Failed on '"+tagsOnly+"', got:\n["+execResult+"]");

    var noTags = "**  Header content    ";
    execResult = header.exec(noTags);
    assert(regExpResultEquals(execResult, [noTags, "**", "Header content    ", ""]),
     "Failed on '"+noTags+"', got:\n["+execResult+"]");

    var minimal = "*";
    execResult = header.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "*", "", ""]),
     "Failed on '"+minimal+"', got:\n["+execResult+"]");

    var allComponents = "**  Header content  :some:tags:@_#%:  ";
    execResult = header.exec(allComponents);
    assert(regExpResultEquals(execResult, [allComponents, "**", "Header content", ":some:tags:@_#%:"]),
     "Failed on '"+allComponents+"', got:\n["+execResult+"]");

    //----- Some examples that are not quite headers, make sure they don't match -----
    var noSpaceAfterStars = "**Header content  :some:tags:@_#%:  ";
    execResult = header.exec(noSpaceAfterStars);
    assert(execResult === null,
     "Failed on '"+noSpaceAfterStars+"', got:\n["+execResult+"]");

    var spaceBeforeStars = " ** Header content  :some:tags:@_#%:  ";
    execResult = header.exec(spaceBeforeStars);
    assert(execResult === null,
     "Failed on '"+spaceBeforeStars+"', got:\n["+execResult+"]");

    var badCharacterInStars = "*-* Header content  :some:tags:@_#%:  ";
    execResult = header.exec(badCharacterInStars);
    assert(execResult === null,
     "Failed on '"+badCharacterInStars+"', got:\n["+execResult+"]");

    var noStars = "   Header content  :some:tags:@_#%:  ";
    execResult = header.exec(noStars);
    assert(execResult === null,
     "Failed on '"+noStars+"', got:\n["+execResult+"]");

    // Make sure TODO Items are also headers - only by checking the list of TODO keywords can we distinguish
    var todoItem = "**  TODO  [#A]   Todo item content  :some:tags:@_#%:  ";
    execResult = header.exec(todoItem);
    assert(regExpResultEquals(execResult, [todoItem, "**", "TODO  [#A]   Todo item content", ":some:tags:@_#%:"]),
     "Failed on '"+todoItem+"', got:\n["+execResult+"]");
  });

  it('should properly parse preformatted blocks', function() {
    var preformatted = tokenRegExps['preformatted'];
    var execResult;

    var indented = "      :   Only the first space after ':' is lost. #%547205#$^*(%$^%&*)#$@";
    execResult = preformatted.exec(indented);
    assert(regExpResultEquals(execResult, [indented, "      ", "  Only the first space after ':' is lost. #%547205#$^*(%$^%&*)#$@"]),
      "Failed on '"+indented+"', got:\n["+execResult+"]");

    var notIndented = ":   Only the first space after ':' is lost. #%547205#$^*(%$^%&*)#$@";
    execResult = preformatted.exec(notIndented);
    assert(regExpResultEquals(execResult, [notIndented, "", "  Only the first space after ':' is lost. #%547205#$^*(%$^%&*)#$@"]),
      "Failed on '"+notIndented+"', got:\n["+execResult+"]");

    var endsAfterColon = "      :";
    execResult = preformatted.exec(endsAfterColon);
    assert(regExpResultEquals(execResult, [endsAfterColon, "      ", ""]),
      "Failed on '"+endsAfterColon+"', got:\n["+execResult+"]");

    var emptyContents = "      : ";
    execResult = preformatted.exec(emptyContents);
    assert(regExpResultEquals(execResult, [emptyContents, "      ", ""]),
      "Failed on '"+emptyContents+"', got:\n["+execResult+"]");

    var minimal = ":";
    execResult = preformatted.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "", ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    //----- Examples that shouldn't match ------
    var noSpaceAfterColon = "      :Only the first space after ':' is lost. #%547205#$^*(%$^%&*)#$@";
    execResult = preformatted.exec(noSpaceAfterColon);
    assert(execResult === null,
      "Failed on '"+noSpaceAfterColon+"', got:\n["+execResult+"]");

    var noLeadingColon = "   Only the first space after ':' is lost. #%547205#$^*(%$^%&*)#$@";
    execResult = preformatted.exec(noLeadingColon);
    assert(execResult === null,
      "Failed on '"+noLeadingColon+"', got:\n["+execResult+"]");
  });

  it('should properly parse dictionary list elements', function() {
    var dictionaryListElem = tokenRegExps['dictionaryListElement'];
    var execResult;

    var allComponentsWithHyphen = "    -  [ ]  term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(allComponentsWithHyphen);
    assert(regExpResultEquals(execResult, [allComponentsWithHyphen, "    ", "-", " ", "term", "definition [takes] :: any characters  "]),
      "Failed on '"+allComponentsWithHyphen+"', got:\n["+execResult+"]");

    var allComponentsWithPlus = "    +  [ ]  term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(allComponentsWithPlus);
    assert(regExpResultEquals(execResult, [allComponentsWithPlus, "    ", "+", " ", "term", "definition [takes] :: any characters  "]),
      "Failed on '"+allComponentsWithPlus+"', got:\n["+execResult+"]");

    var allComponentsWithStar = "    *  [ ]  term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(allComponentsWithStar);
    assert(regExpResultEquals(execResult, [allComponentsWithStar, "   ", " *", " ", "term", "definition [takes] :: any characters  "]),
      "Failed on '"+allComponentsWithStar+"', got:\n["+execResult+"]");

    var allComponentsWithNumberDot = "    134.  [ ]  term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(allComponentsWithNumberDot);
    assert(regExpResultEquals(execResult, [allComponentsWithNumberDot, "    ", "134.", " ", "term", "definition [takes] :: any characters  "]),
      "Failed on '"+allComponentsWithNumberDot+"', got:\n["+execResult+"]");

    var allComponentsWithNumberParens = "    134)  [ ]  term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(allComponentsWithNumberParens);
    assert(regExpResultEquals(execResult, [allComponentsWithNumberParens, "    ", "134)", " ", "term", "definition [takes] :: any characters  "]),
      "Failed on '"+allComponentsWithNumberParens+"', got:\n["+execResult+"]");

    var noCheckbox = "    -  term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(noCheckbox);
    assert(regExpResultEquals(execResult, [noCheckbox, "    ", "-", "", "term", "definition [takes] :: any characters  "]),
      "Failed on '"+noCheckbox+"', got:\n["+execResult+"]");

    var checkedCheckbox = "    - [X] term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(checkedCheckbox);
    assert(regExpResultEquals(execResult, [checkedCheckbox, "    ", "-", "X", "term", "definition [takes] :: any characters  "]),
      "Failed on '"+checkedCheckbox+"', got:\n["+execResult+"]");

    var hyphenCheckbox = "    - [-] term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(hyphenCheckbox);
    assert(regExpResultEquals(execResult, [hyphenCheckbox, "    ", "-", "-", "term", "definition [takes] :: any characters  "]),
      "Failed on '"+hyphenCheckbox+"', got:\n["+execResult+"]");

    var badCharInCheckbox = "    -  [x] term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(badCharInCheckbox);
    assert(regExpResultEquals(execResult, [badCharInCheckbox, "    ", "-", "", "[x] term", "definition [takes] :: any characters  "]),
      "Failed on '"+badCharInCheckbox+"', got:\n["+execResult+"]");

    var emptyCheckbox = "    -  [] term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(emptyCheckbox);
    assert(regExpResultEquals(execResult, [emptyCheckbox, "    ", "-", "", "[] term", "definition [takes] :: any characters  "]),
      "Failed on '"+emptyCheckbox+"', got:\n["+execResult+"]");

    var noIndentation = "-  term  ::  definition [takes] :: any characters  ";
    execResult = dictionaryListElem.exec(noIndentation);
    assert(regExpResultEquals(execResult, [noIndentation, "", "-", "", "term", "definition [takes] :: any characters  "]),
      "Failed on '"+noIndentation+"', got:\n["+execResult+"]");

    var emptyTerm = "    -  [ ]  ::  definition [takes] any characters  ";
    execResult = dictionaryListElem.exec(emptyTerm);
    assert(regExpResultEquals(execResult, [emptyTerm, "    ", "-", " ", "", "definition [takes] :: any characters  "]),
      "Failed on '"+emptyTerm+"', got:\n["+execResult+"]");

    var emptyDefinition = "    -  [ ] the term ::    ";
    execResult = dictionaryListElem.exec(emptyDefinition);
    assert(regExpResultEquals(execResult, [emptyDefinition, "    ", "-", " ", "the term", ""]),
      "Failed on '"+emptyDefinition+"', got:\n["+execResult+"]");

    var minimal = "- :: ";
    execResult = dictionaryListElem.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "", "-", "", "", ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    //----- Examples that should not match -----
    var noDoubleColon = "    -  [X] term  definition [takes] any characters  ";
    execResult = dictionaryListElem.exec(noDoubleColon);
    assert(execResult === null,
      "Failed on '"+noDoubleColon+"', got:\n["+execResult+"]");

    var noSpaceAfterBullet = "    -term ::  definition [takes] any characters  ";
    execResult = dictionaryListElem.exec(noSpaceAfterBullet);
    assert(execResult === null,
      "Failed on '"+noSpaceAfterBullet+"', got:\n["+execResult+"]");

    var noSpaceBeforeColons = "    - term::  definition [takes] any characters  ";
    execResult = dictionaryListElem.exec(noSpaceBeforeColons);
    assert(execResult === null,
      "Failed on '"+noSpaceBeforeColons+"', got:\n["+execResult+"]");

    var noSpaceAfterColons = "    - term ::definition [takes] any characters  ";
    execResult = dictionaryListElem.exec(noSpaceAfterColons);
    assert(execResult === null,
      "Failed on '"+noSpaceAfterColons+"', got:\n["+execResult+"]");

    var noSpaceBeforeStar = "* term :: definition [takes] any characters  ";
    execResult = dictionaryListElem.exec(noSpaceBeforeStar);
    assert(execResult === null,
      "Failed on '"+noSpaceBeforeStar+"', got:\n["+execResult+"]");
  });

  it('should properly parse list elements', function() {
    var listElem = tokenRegExps['listElement'];
    var execResult;

    var allComponentsWithHyphen = "    -  [ ]  here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(allComponentsWithHyphen);
    assert(regExpResultEquals(execResult, [allComponentsWithHyphen, "    ", "-", " ", "here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+allComponentsWithHyphen+"', got:\n["+execResult+"]");
    
    var allComponentsWithPlus = "    +  [ ]  here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(allComponentsWithPlus);
    assert(regExpResultEquals(execResult, [allComponentsWithPlus, "    ", "+", " ", "here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+allComponentsWithPlus+"', got:\n["+execResult+"]");
    
    var allComponentsWithStar = "    *  [ ]  here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(allComponentsWithStar);
    assert(regExpResultEquals(execResult, [allComponentsWithStar, "   ", " *", " ", "here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+allComponentsWithStar+"', got:\n["+execResult+"]");
    
    var allComponentsWithNumberDot = "    134.  [ ]  here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(allComponentsWithNumberDot);
    assert(regExpResultEquals(execResult, [allComponentsWithNumberDot, "    ", "134.", " ", "here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+allComponentsWithNumberDot+"', got:\n["+execResult+"]");
    
    var allComponentsWithNumberParens = "    134)  [ ]  here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(allComponentsWithNumberParens);
    assert(regExpResultEquals(execResult, [allComponentsWithNumberParens, "    ", "134)", " ", "here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+allComponentsWithNumberParens+"', got:\n["+execResult+"]");

    var noCheckbox = "    -  here is the contents of the list item &@(#&$)@4543{}    ";
    execResult = listElem.exec(noCheckbox);
    assert(regExpResultEquals(execResult, [noCheckbox, "    ", "-", "", "here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+noCheckbox+"', got:\n["+execResult+"]");

    var checkedCheckbox = "    - [X] here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(checkedCheckbox);
    assert(regExpResultEquals(execResult, [checkedCheckbox, "    ", "-", "X", "here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+checkedCheckbox+"', got:\n["+execResult+"]");

    var hyphenCheckbox = "    - [-] here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(hyphenCheckbox);
    assert(regExpResultEquals(execResult, [hyphenCheckbox, "    ", "-", "-", "here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+hyphenCheckbox+"', got:\n["+execResult+"]");

    var badCharInCheckbox = "    -  [x] here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(badCharInCheckbox);
    assert(regExpResultEquals(execResult, [badCharInCheckbox, "    ", "-", "", "[x] here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+badCharInCheckbox+"', got:\n["+execResult+"]");

    var emptyCheckbox = "    -  [] here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(emptyCheckbox);
    assert(regExpResultEquals(execResult, [emptyCheckbox, "    ", "-", "", "[] here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+emptyCheckbox+"', got:\n["+execResult+"]");

    var noIndentation = "-  here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(noIndentation);
    assert(regExpResultEquals(execResult, [noIndentation, "", "-", "", "here is the contents of the list item &@(#&$)@4543{}  "]),
      "Failed on '"+noIndentation+"', got:\n["+execResult+"]");

    var checkboxOnly = "  -  [ ]";
    execResult = listElem.exec(checkboxOnly);
    assert(regExpResultEquals(execResult, [checkboxOnly, "  ", "-", " ", ""]),
      "Failed on '"+checkboxOnly+"', got:\n["+execResult+"]");

    var empty = "  -  ";
    execResult = listElem.exec(empty);
    assert(regExpResultEquals(execResult, [empty, "  ", "-", "", ""]),
      "Failed on '"+empty+"', got:\n["+execResult+"]");

    var minimal = "-";
    execResult = listElem.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "", "-", "", ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    //----- Examples that should not match -----
    var noSpaceAfterBullet = "    -[ ] here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(noSpaceAfterBullet);
    assert(execResult === null,
      "Failed on '"+noSpaceAfterBullet+"', got:\n["+execResult+"]");

    var noSpaceBeforeStar = "* here is the contents of the list item &@(#&$)@4543{}  ";
    execResult = listElem.exec(noSpaceBeforeStar);
    assert(execResult === null,
      "Failed on '"+noSpaceBeforeStar+"', got:\n["+execResult+"]");
  });
});