/* lexical grammar */
%lex
%x quoted

%%
\s+                                          /* skip whitespace */
"!"                                          return "!";
"("                                          return "(";
")"                                          return ")";
"["                                          return "[";
"]"                                          return "]";
","                                          return ",";
"'"                                          this.begin("quoted"); strBuff = []; return "QUOTE";
[a-z][a-zA-Z0-9_]*                           return "ATOM";
[A-Z_][a-zA-Z0-9_]*                          return "VAR";
[:\-~<>]+                                    return "ATOM";
<quoted>"'"                                  this.popState(); return "QUOTE";
<quoted>[^\\]                                strBuff.push(yytext); return "QUOTED_CHAR";
<quoted>\\.                                  strBuff.push(unescape(yytext[1])); return "ESC_SEQ";
[0-9]+(\.[0-9]*)?([eE][+\-][0-9]+)?          return "NUMBER";
<<EOF>>                                      return 'EOF';

/lex
%{
  var strBuff;
  function unescape(c) {
    switch(c) {
    case "n": return "\n";
    case "t": return "\t";
    case "r": return "\r";
    default: return c;
    }
  }
  var listStack = [];
  var currList;
  function pushList() {
    currList = [];
    listStack.push(currList);
    return currList;
  }
  function popList() {
    currList = listStack[listStack.length - 2];
    return listStack.pop();
  }
%}
%start term

%% /* language grammar */

term
    : t EOF
        {return $1;}
    ;

t
    :  '!' strBody
        {$$ = $2;}
    |  atom
        {$$ = {name: $1, args: []};}
    |  atom "(" termList ")"
        {$$ = {name: $1, args: $3};}
    |  "[" "]"
        {$$ = [];}
    |  "[" termList "]"
        {$$ = $2;}
    |  NUMBER
        {$$ = Number(yytext);}
    |  VAR
        {$$ = {var: yytext};}
    ;

strBody
    :  atom
        {$$ = $1;}
    |  '(' atom ')'
        {$$ = $2;}
    ;

atom
    :  ATOM
        {$$ = $1;}
    |  QUOTE quotedAtom QUOTE
        {$$ = strBuff.join('');}
    ;

quotedAtom
    :  QUOTED_CHAR quotedAtom
    |  ESC_SEQ quotedAtom
    |  /* empty */
    ;

termList
    : beginTermList termListBody
       {$$ = popList();}
    ;

beginTermList
    :
       { pushList(); }
    ;

termListBody
    :  listElem
    |  listElem "," termListBody
    ;

listElem
    :  t
       { currList.push($1); }
    ;
