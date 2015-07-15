/* lexical grammar */
%lex
%x quoted

%%
\s+                   /* skip whitespace */
"!"                   return "!";
"("                   return "(";
")"                   return ")";
"'"                   this.begin("quoted"); strBuff = []; return "QUOTE";
[a-z][a-zA-Z0-9_]*    return "ATOM";
<<EOF>>               return 'EOF';
<quoted>"'"           this.popState(); return "QUOTE";
<quoted>[^\\]         strBuff.push(yytext); return "QUOTED_CHAR";
<quoted>\\.           strBuff.push(unescape(yytext[1])); return "ESC_SEQ";

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

