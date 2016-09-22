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
    if (arr1 === null && arr2 === null)
      return true;
    if (arr1 === null || arr2 === null)
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

  it('should properly match TODO items', function() {
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
  

  it('should properly match headers', function() {
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

  it('should properly match dictionary list elements', function() {
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

  it('should properly match list elements', function() {
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

  it('should properly match drawer beginnings', function() {
    var beginDrawer = tokenRegExps['beginDrawer'];
    var execResult;

    var minimal = "::";
    execResult = beginDrawer.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "", ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    var normal = ":my_drawer-1:  ";
    execResult = beginDrawer.exec(normal);
    assert(regExpResultEquals(execResult, [normal, "", "my_drawer-1"]),
      "Failed on '"+normal+"', got:\n["+execResult+"]");

    var indented = "  \t :my_drawer-1:  ";
    execResult = beginDrawer.exec(indented);
    assert(regExpResultEquals(execResult, [indented, "  \t ", "my_drawer-1"]),
      "Failed on '"+indented+"', got:\n["+execResult+"]");

    //----- Examples that will not match -----
    var noOpeningColon = "my_drawer-1:";
    execResult = beginDrawer.exec(noOpeningColon);
    assert(execResult === null,
      "Failed on '"+noOpeningColon+"', got:\n["+execResult+"]");

    var noClosingColon = ":my_drawer-1";
    execResult = beginDrawer.exec(noClosingColon);
    assert(execResult === null,
      "Failed on '"+noClosingColon+"', got:\n["+execResult+"]");

    var spaceAfterOpeningColon = ": my_drawer-1:";
    execResult = beginDrawer.exec(spaceAfterOpeningColon);
    assert(execResult === null,
      "Failed on '"+spaceAfterOpeningColon+"', got:\n["+execResult+"]");

    var illegalCharInName = ":my_$drawer-1:";
    execResult = beginDrawer.exec(illegalCharInName);
    assert(execResult === null,
      "Failed on '"+illegalCharInName+"', got:\n["+execResult+"]");

    var spaceAfterName = ":my_drawer-1 :";
    execResult = beginDrawer.exec(spaceAfterName);
    assert(execResult === null,
      "Failed on '"+spaceAfterName+"', got:\n["+execResult+"]");

    var somethingBeforeOpeningColon = "   a:my_drawer-1:";
    execResult = beginDrawer.exec(somethingBeforeOpeningColon);
    assert(execResult === null,
      "Failed on '"+somethingBeforeOpeningColon+"', got:\n["+execResult+"]");

    var somethingAfterClosingColon = ":my_drawer-1:  a ";
    execResult = beginDrawer.exec(somethingAfterClosingColon);
    assert(execResult === null,
      "Failed on '"+somethingAfterClosingColon+"', got:\n["+execResult+"]");
  });

  it('should properly match drawer endings', function() {
    var endDrawer = tokenRegExps['endDrawer'];
    var execResult;

    var minimal = ":END:";
    execResult = endDrawer.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    var indented = "  \t :END:  ";
    execResult = endDrawer.exec(indented);
    assert(regExpResultEquals(execResult, [indented, "  \t "]),
      "Failed on '"+indented+"', got:\n["+execResult+"]");

    //----- Examples that will not match -----
    var noOpeningColon = "END:";
    execResult = endDrawer.exec(noOpeningColon);
    assert(execResult === null,
      "Failed on '"+noOpeningColon+"', got:\n["+execResult+"]");

    var noClosingColon = ":END";
    execResult = endDrawer.exec(noClosingColon);
    assert(execResult === null,
      "Failed on '"+noClosingColon+"', got:\n["+execResult+"]");

    var spaceAfterOpeningColon = ": END:";
    execResult = endDrawer.exec(spaceAfterOpeningColon);
    assert(execResult === null,
      "Failed on '"+spaceAfterOpeningColon+"', got:\n["+execResult+"]");

    var notEND = ":end:";
    execResult = endDrawer.exec(notEND);
    assert(execResult === null,
      "Failed on '"+notEND+"', got:\n["+execResult+"]");

    var spaceAfterName = ":END :";
    execResult = endDrawer.exec(spaceAfterName);
    assert(execResult === null,
      "Failed on '"+spaceAfterName+"', got:\n["+execResult+"]");

    var somethingBeforeOpeningColon = "   a:END:";
    execResult = endDrawer.exec(somethingBeforeOpeningColon);
    assert(execResult === null,
      "Failed on '"+somethingBeforeOpeningColon+"', got:\n["+execResult+"]");

    var somethingAfterClosingColon = ":END:  a ";
    execResult = endDrawer.exec(somethingAfterClosingColon);
    assert(execResult === null,
      "Failed on '"+somethingAfterClosingColon+"', got:\n["+execResult+"]");
  });

  it('should properly match block beginnings', function() {
    var beginBlock = tokenRegExps['beginBlock'];
    var execResult;

    var allComponents = "    #+BEGIN_NAME$123:   params go here -l 4 +a  ";
    execResult = beginBlock.exec(allComponents);
    assert(regExpResultEquals(execResult, [allComponents, "    ", "NAME$123:", "params go here -l 4 +a  "]),
      "Failed on '"+allComponents+"', got:\n["+execResult+"]");

    var noParams = "    #+BEGIN_NAME   ";
    execResult = beginBlock.exec(noParams);
    assert(regExpResultEquals(execResult, [noParams, "    ", "NAME", ""]),
      "Failed on '"+noParams+"', got:\n["+execResult+"]");

    var minimal = "#+BEGIN_NAME";
    execResult = beginBlock.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "", "NAME", ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    //----- Examples that should not match -----
    var noName = "    #+BEGIN_   params go here -l 4 +a  ";
    execResult = beginBlock.exec(noName);
    assert(execResult === null,
      "Failed on '"+noName+"', got:\n["+execResult+"]");

    var noPlus = "#BEGIN_NAME   params go here -l 4 +a  ";
    execResult = beginBlock.exec(noPlus);
    assert(execResult === null,
      "Failed on '"+noPlus+"', got:\n["+execResult+"]");

    var noHash = "    +BEGIN_NAME   params go here -l 4 +a  ";
    execResult = beginBlock.exec(noHash);
    assert(execResult === null,
      "Failed on '"+noHash+"', got:\n["+execResult+"]");

    var wrongSeparator = "    #+BEGIN-NAME   params go here -l 4 +a  ";
    execResult = beginBlock.exec(wrongSeparator);
    assert(execResult === null,
      "Failed on '"+wrongSeparator+"', got:\n["+execResult+"]");
  });

  it('should properly match block endings', function() {
    var endBlock = tokenRegExps['endBlock'];
    var execResult;

    var allComponents = "   #+END_NAME$123:  ";
    execResult = endBlock.exec(allComponents);
    assert(regExpResultEquals(execResult, [allComponents, "   ", "NAME$123:"]),
      "Failed on '"+allComponents+"', got:\n["+execResult+"]");

    var minimal = "#+END_N";
    execResult = endBlock.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "", "N"]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    //----- Examples that should not match -----
    var noName = "    #+END_  ";
    execResult = endBlock.exec(noName);
    assert(execResult === null,
      "Failed on '"+noName+"', got:\n["+execResult+"]");

    var noPlus = "#END_NAME  ";
    execResult = endBlock.exec(noPlus);
    assert(execResult === null,
      "Failed on '"+noPlus+"', got:\n["+execResult+"]");

    var noHash = "    +END_NAME  ";
    execResult = endBlock.exec(noHash);
    assert(execResult === null,
      "Failed on '"+noHash+"', got:\n["+execResult+"]");

    var wrongSeparator = "    #+END-NAME  ";
    execResult = endBlock.exec(wrongSeparator);
    assert(execResult === null,
      "Failed on '"+wrongSeparator+"', got:\n["+execResult+"]");
  });

  it('should properly match dynamic block beginnings', function() {
    var beginDynamicBlock = tokenRegExps['beginDynamicBlock'];
    var execResult;

    var allComponents = "    #+BEGIN:   NAME$123:   params go here -l 4 +a  ";
    execResult = beginDynamicBlock.exec(allComponents);
    assert(regExpResultEquals(execResult, [allComponents, "    ", "NAME$123:", "params go here -l 4 +a  "]),
      "Failed on '"+allComponents+"', got:\n["+execResult+"]");

    var noParams = "    #+BEGIN:   NAME   ";
    execResult = beginDynamicBlock.exec(noParams);
    assert(regExpResultEquals(execResult, [noParams, "    ", "NAME", ""]),
      "Failed on '"+noParams+"', got:\n["+execResult+"]");

    var minimal = "#+BEGIN: NAME";
    execResult = beginDynamicBlock.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "", "NAME", ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    //----- Examples that should not match -----
    var noPlus = "#BEGIN: NAME   params go here -l 4 +a  ";
    execResult = beginDynamicBlock.exec(noPlus);
    assert(execResult === null,
      "Failed on '"+noPlus+"', got:\n["+execResult+"]");

    var noHash = "    +BEGIN: NAME   params go here -l 4 +a  ";
    execResult = beginDynamicBlock.exec(noHash);
    assert(execResult === null,
      "Failed on '"+noHash+"', got:\n["+execResult+"]");

    var wrongSeparator = "    #+BEGIN_NAME   params go here -l 4 +a  ";
    execResult = beginDynamicBlock.exec(wrongSeparator);
    assert(execResult === null,
      "Failed on '"+wrongSeparator+"', got:\n["+execResult+"]");
  });

  it('should properly match dynamic block endings', function() {
    var endDynamicBlock = tokenRegExps['endDynamicBlock'];
    var execResult;

    var indented = "   \t  #+END:   ";
    execResult = endDynamicBlock.exec(indented);
    assert(regExpResultEquals(execResult, [indented, "   \t  "]),
      "Failed on '"+indented+"', got:\n["+execResult+"]");

    var minimal = "#+END:";
    execResult = endDynamicBlock.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    //----- Examples that should not match -----
    var noHash = "+END:";
    execResult = endDynamicBlock.exec(noHash);
    assert(regExpResultEquals(execResult, null),
      "Failed on '"+noHash+"', got:\n["+execResult+"]");

    var noPlus = "#END:";
    execResult = endDynamicBlock.exec(noPlus);
    assert(regExpResultEquals(execResult, null),
      "Failed on '"+noPlus+"', got:\n["+execResult+"]");

    var noColon = "#+END";
    execResult = endDynamicBlock.exec(noColon);
    assert(regExpResultEquals(execResult, null),
      "Failed on '"+noColon+"', got:\n["+execResult+"]");

    var somethingAfter = "   \t  #END:  hi ";
    execResult = endDynamicBlock.exec(somethingAfter);
    assert(regExpResultEquals(execResult, null),
      "Failed on '"+somethingAfter+"', got:\n["+execResult+"]");
  });

  it('should properly match directives', function() {
    var directive = tokenRegExps['directive'];
    var execResult;

    var allComponents = "    #+NAME$123::   params go here -l 4 +a  ";
    execResult = directive.exec(allComponents);
    assert(regExpResultEquals(execResult, [allComponents, "    ", "NAME$123:", "params go here -l 4 +a  "]),
      "Failed on '"+allComponents+"', got:\n["+execResult+"]");

    var noParams = "    #+NAME:   ";
    execResult = directive.exec(noParams);
    assert(regExpResultEquals(execResult, [noParams, "    ", "NAME", ""]),
      "Failed on '"+noParams+"', got:\n["+execResult+"]");

    var minimal = "#+NAME:";
    execResult = directive.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "", "NAME", ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    //----- Examples that should not match -----
    var noName = "    #+   params go here -l 4 +a  ";
    execResult = directive.exec(noName);
    assert(execResult === null,
      "Failed on '"+noName+"', got:\n["+execResult+"]");

    var noPlus = "#NAME:   params go here -l 4 +a  ";
    execResult = directive.exec(noPlus);
    assert(execResult === null,
      "Failed on '"+noPlus+"', got:\n["+execResult+"]");

    var noHash = "    +NAME:   params go here -l 4 +a  ";
    execResult = directive.exec(noHash);
    assert(execResult === null,
      "Failed on '"+noHash+"', got:\n["+execResult+"]");
  });

  it('should properly match preformatted blocks', function() {
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

    var tabDelimited = "\t\t:\tHere's some content";
    execResult = preformatted.exec(tabDelimited);
    assert(regExpResultEquals(execResult, [tabDelimited, "\t\t", "Here's some content"]),
      "Failed on '"+tabDelimited+"', got:\n["+execResult+"]");

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

  it('should properly match blank lines', function() {
    var blank = tokenRegExps['blank'];
    var execResult;

    var minimal = "";
    execResult = blank.exec(minimal);
    assert(regExpResultEquals(execResult, [""]), "Failed on '', got:\n["+execResult+"]");

    var oneSpace = " ";
    execResult = blank.exec(oneSpace);
    assert(regExpResultEquals(execResult, [" "]), "Failed on ' ', got:\n["+execResult+"]");

    var manySpaces = "          ";
    execResult = blank.exec(manySpaces);
    assert(regExpResultEquals(execResult, ["          "]), "Failed on '          ', got:\n["+execResult+"]");

    var oneTab = "\t";
    execResult = blank.exec(oneTab);
    assert(regExpResultEquals(execResult, ["\t"]), "Failed on '\\t', got:\n["+execResult+"]");

    var mixture = "   \t   \t  ";
    execResult = blank.exec(mixture);
    assert(regExpResultEquals(execResult, ["   \t   \t  "]), "Failed on '   \\t   \\t  ', got:\n["+execResult+"]");

    // Non-matching example
    var nonSpace = "a";
    execResult = blank.exec(nonSpace);
    assert(execResult === null, "Failed on 'a', got:\n["+execResult+"]");
  });

  it('should properly match horizontal rules', function() {
    var hRule = tokenRegExps['horizontalRule'];
    var execResult;

    var minimal = "-----";
    execResult = hRule.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    var indented = "  \t  -----";
    execResult = hRule.exec(indented);
    assert(regExpResultEquals(execResult, [indented, "  \t  "]),
      "Failed on '"+indented+"', got:\n["+execResult+"]");

    var manyHyphens = "  \t  ----------------";
    execResult = hRule.exec(manyHyphens);
    assert(regExpResultEquals(execResult, [manyHyphens, "  \t  "]),
      "Failed on '"+manyHyphens+"', got:\n["+execResult+"]");

    var trailingSpace = "  \t  -----   ";
    execResult = hRule.exec(trailingSpace);
    assert(regExpResultEquals(execResult, [trailingSpace, "  \t  "]),
      "Failed on '"+trailingSpace+"', got:\n["+execResult+"]");

    //----- Examples that should not match -----
    var tooFewHyphens = "  \t  ----";
    execResult = hRule.exec(tooFewHyphens);
    assert(execResult === null,
      "Failed on '"+tooFewHyphens+"', got:\n["+execResult+"]");

    var somethingBeforeHyphens = "  \t  hello -----";
    execResult = hRule.exec(somethingBeforeHyphens);
    assert(execResult === null,
      "Failed on '"+somethingBeforeHyphens+"', got:\n["+execResult+"]");
  });

  it('should properly match comments', function() {
    var comment = tokenRegExps['comment'];
    var execResult;

    var minimal =  "#";
    execResult = comment.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "", ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    var indented =  "   #";
    execResult = comment.exec(indented);
    assert(regExpResultEquals(execResult, [indented, "   ", ""]),
      "Failed on '"+indented+"', got:\n["+execResult+"]");

    var emptyComment =  "   #         ";
    execResult = comment.exec(emptyComment);
    assert(regExpResultEquals(execResult, [emptyComment, "   ", "         "]),
      "Failed on '"+emptyComment+"', got:\n["+execResult+"]");

    var fullComment =  "   #Here is a normal comment. Let's add some special chars #%*$^%#)%*$(#&%{}{1243368";
    execResult = comment.exec(fullComment);
    assert(regExpResultEquals(execResult, [fullComment, "   ", "Here is a normal comment. Let's add some special chars #%*$^%#)%*$(#&%{}{1243368"]),
      "Failed on '"+fullComment+"', got:\n["+execResult+"]");

    //----- Examples that should not match -----
    var directive =  "   #+Here is a normal comment. Let's add some special chars #%*$^%#)%*$(#&%{}{1243368";
    execResult = comment.exec(directive);
    assert(execResult === null,
      "Failed on '"+directive+"', got:\n["+execResult+"]");

    var noHashChar =  "   Here is a normal comment. Let's add some special chars #%*$^%#)%*$(#&%{}{1243368";
    execResult = comment.exec(noHashChar);
    assert(execResult === null,
      "Failed on '"+noHashChar+"', got:\n["+execResult+"]");
  });

  it('should properly match paragraph lines', function() {
    var line = tokenRegExps['line'];
    var execResult;

    var minimal = "";
    execResult = line.exec(minimal);
    assert(regExpResultEquals(execResult, [minimal, "", ""]),
      "Failed on '"+minimal+"', got:\n["+execResult+"]");

    var onlySpaces = "   ";
    execResult = line.exec(onlySpaces);
    assert(regExpResultEquals(execResult, [onlySpaces, "   ", ""]),
      "Failed on '"+onlySpaces+"', got:\n["+execResult+"]");

    var fullLine = "   This line is indented by 3 spaces. All chars are allowed: #%&)^%@$#@)35514875{::{:'\"";
    execResult = line.exec(fullLine);
    assert(regExpResultEquals(execResult, [fullLine, "   ", "This line is indented by 3 spaces. All chars are allowed: #%&)^%@$#@)35514875{::{:'\""]),
      "Failed on '"+fullLine+"', got:\n["+execResult+"]");

    // There is nothing that doesn't match the line regexp - it is a catchall for everthing else whose sole job
    // is to capture indentation.
  });
});