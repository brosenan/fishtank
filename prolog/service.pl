% Service utilities for the Cedalion commands
:- op(1200, xfy, '~>').
:- op(100, xfx, ':').
:- op(100, fx, '$').
:- op(650, xfx, '::').
:- op(1, fx, '!').
:- op(0, xfx, (':=')).
:- op(0, yfx, ('div')).
:- op(0, yfx, ('xor')).

% If predicate
if(Cond, Then, _) :-
	Cond,
	!,
	Then.
if(_, _, Else) :-
	Else.

if(Cond, Then) :-
	if(Cond, Then, true).

% Parse a typed term to its name and arguments, or vice versa
parseTerm(Term::_, !(Func), TArgs) :-
	if(var(Term), 
		(
			makeTyped(Args, TArgs),
			Term =.. [Func | Args]
		),
		(
			Term =.. [Func | Args],
			makeTyped(Args, TArgs)
		)).

makeTyped([], []).
makeTyped([First | Rest], [First::_ | TRest]) :-
	makeTyped(Rest, TRest).

% Insert a statement to the database
insert(Statement) :-
	forall(translateStatement(Statement, Clause), assert(Clause)).

% Remove a statement to the database
remove(Statement) :-
	forall(translateStatement(Statement, Clause), if(retract(Clause), true, true)).

translateStatement(Statement, Statement).
translateStatement((Head ~> Body), (H:-B)) :-
	translateRewrite(Head, Body, H, B).

translateRewrite(Head, Body, Body, Head) :-
	\+Body = (_ :- _).
translateRewrite(Head, Body, H, (Head, B)) :-
	rewriteBodyToClause(Body, H, B).

rewriteBodyToClause((H :- B), H, B).
rewriteBodyToClause((S1 ~> S2), H, B) :-
	translateRewrite(S1, S2, H, B).

% Load/Reload a file to the database
loadFile(!(FileName), !(Namespace)) :-
	forall((retract('builtin#loadedStatement'(!FileName, Statement, _)), removeAnnotations(Statement, NoAnnot)), remove(NoAnnot)),
	open(FileName, read, Stream),
	read_term(Stream, Term, [variable_names(RawVarNames)]),
	convertVarNames(RawVarNames, VarNames),
	insertTermsFromSteam(Stream, Term, FileName, [default=Namespace], VarNames).

insertTermsFromSteam(Stream, Term, FileName, NsList, VarNames) :-
	if(Term=end_of_file,
		(
			close(Stream)
		),
		(
			interpretTerm(Term, FileName, NsList, NewNsList, VarNames),
			read_term(Stream, NewTerm, [variable_names(RawVarNames)]),
			convertVarNames(RawVarNames, NewVarNames),
			insertTermsFromSteam(Stream, NewTerm, FileName, NewNsList, NewVarNames)
		)).

interpretTerm(Term, FileName, NsList, NewNsList, VarNames) :-
	if(Term = builtin:import(!(Alias), !(FullNs)),
		NewNsList = [Alias=FullNs | NsList],
		(
			NewNsList = NsList,
			localToGlobal(Term, NsList, GTerm),
			assert('builtin#loadedStatement'(!FileName, GTerm, VarNames)),
			removeAnnotations(GTerm, UnAnnotated),
			if((UnAnnotated = (Statement ~> _), \+var(Statement)), % Avoid exception if not implemented
				assert((Statement :- fail))),
			insert(UnAnnotated)

		)).

removeAnnotations(WithAnnot, NoAnnot) :-
	if(nonCompoundTerm(WithAnnot),
		NoAnnot = WithAnnot,
	%else
	(
		if(WithAnnot = 'annotation#escape'(Esc),
			NoAnnot = Esc,
		%else
		(
			WithAnnot =.. [Func | Args],
			if((concat_atom(['annotation#', _], Func), Args = [First | _]),
				removeAnnotations(First, NoAnnot),
			%else
			(
				removeAnnotationsFromList(Args, ArgsNoAnnot),
				NoAnnot =.. [Func | ArgsNoAnnot]
			))
		))
	)).

removeAnnotationsFromList([], []).
removeAnnotationsFromList([First | Rest], [NoAnnot | NoAnnotList]) :-
	removeAnnotations(First, NoAnnot),
	removeAnnotationsFromList(Rest, NoAnnotList).

% Translating from local terms (specific to this file) to their global representation
localToGlobal(Local, NsList, Global) :-
	if(nonCompoundTerm(Local),
		Global = Local,
		(
			if(Local = NsAlias:Term,
				(
					findNamespaceInList(NsAlias, NsList, Namespace),
					termLocalToGlobal(Term, Namespace, NsList, Global)
				),
				localToGlobal(default:Local, NsList, Global))
		)).

nonCompoundTerm(Term) :-
	var(Term).
nonCompoundTerm(Term) :-
	number(Term).
nonCompoundTerm(!(X)) :-
	atom(X).

termLocalToGlobal(Term, Namespace, NsList, Global) :-
	Term =.. [Func | Args],
	if(dontConvertFunc(Func),
		GFunc = Func,
		concat_atom([Namespace, '#', Func], GFunc)),
	localToGlobalList(Args, NsList, GArgs),
	Global =.. [GFunc | GArgs].

localToGlobalList([], _, []).
localToGlobalList([Local | Locals], NsList, [Global | Globals]) :-
	localToGlobal(Local, NsList, Global),
	localToGlobalList(Locals, NsList, Globals).

findNamespaceInList(Alias, [], Alias).
findNamespaceInList(Alias, [Alias=Namespace | _], Namespace).
findNamespaceInList(Alias, [BadAlias=_ | NsList], Namespace) :-
	\+(BadAlias = Alias),
	findNamespaceInList(Alias, NsList, Namespace).

dontConvertFunc('[]').
dontConvertFunc('.').
dontConvertFunc(Op) :- current_op(_, _, Op).
dontConvertFunc(Func) :- \+atom(Func).


% Read a file into a list of terms and variable names (translates to global terms).
readFile(!(FileName), !(Namespace), 'builtin#fileContent'(Terms, NsListOut)) :-
	open(FileName, read, Stream),
	read_term(Stream, Term, [variable_names(VarNames)]),
	readFromSteam(Stream, Term, VarNames, FileName, [default=Namespace], NsListOut, Terms).

readFromSteam(Stream, Term, VarNames, FileName, NsList, NsListOut, Terms) :-
	if(Term = end_of_file,
		(
			Terms = [],
			close(Stream),
			NsListOut = NsList
		),
		(
			if(Term = builtin:import(!(Alias), !(Namespace)),
				(
					NewNsList = [Alias=Namespace | NsList]
				),
				(
					NewNsList = NsList
				)),
				localToGlobal(Term, NsList, GTerm),
			read_term(Stream, NewTerm, [variable_names(NewVarNames)]),
			readFromSteam(Stream, NewTerm, NewVarNames, FileName, NewNsList, NsListOut, OtherTerms),
			convertVarNames(VarNames, ConvVarNames),
			Terms = ['builtin#statement'(GTerm, ConvVarNames) | OtherTerms]
		)).

convertVarNames([], []).
convertVarNames([Name=Var | RestIn], ['builtin#varName'(Var::_, !(Name)) | RestOut]) :-
	convertVarNames(RestIn, RestOut).

% Write a cedalion file
writeFile(!(FileName), 'builtin#fileContent'(Term, Goal, NsList)) :-
	open(FileName, write, Stream),
	writeToStream(Stream, Goal, Term, NsList),
	close(Stream).

writeFile(!(FileName), 'builtin#fileContent'(Terms, NsList)) :-
	open(FileName, write, Stream),
	writeToStream(Stream, Terms, NsList).

writeToStream(Stream, Goal, 'builtin#statement'(GTerm, VarNames), NsList) :-
	Goal,
	globalToLocal(GTerm, NsList, Term),
	writeTerm(Stream, Term, VarNames),
	fail.
writeToStream(_, _, _, _).


writeToStream(Stream, [], _) :-
	close(Stream).

writeToStream(Stream, ['builtin#statement'(GTerm, VarNames) | OtherTerms], NsList) :-
	globalToLocal(GTerm, NsList, Term),
	writeTerm(Stream, Term, VarNames),
	writeToStream(Stream, OtherTerms, NsList).

globalToLocal(GTerm, NsList, Term) :-
	if(nonCompoundTerm(GTerm),
		Term = GTerm,
		(
			GTerm =.. [GFunc | GArgs],
			globalToLocalList(GArgs, NsList, Args),
			if(splitNamespace(GFunc, Namespace, Func),
				(
					LTerm =.. [Func | Args],
					findNamespaceAlias(Namespace, NsList, Alias),
					if(Alias = default,
						Term = LTerm,
						Term = Alias:LTerm)
				),
				Term =.. [GFunc | Args])
		)).

globalToLocalList([], _, []).
globalToLocalList([GArg | GArgs], NsList, [Arg | Args]) :-
	globalToLocal(GArg, NsList, Arg),
	globalToLocalList(GArgs, NsList, Args).

splitNamespace(GlobalName, NsAlias, LocalName) :-
	atom_chars(GlobalName, Chars),
	append(Pre, ['#' | Post], Chars),
	atom_chars(NsAlias, Pre),
	atom_chars(LocalName, Post).

findNamespaceAlias(Alias, [], Alias).
findNamespaceAlias(Namespace, [Alias1 = Namespace1 | NsList], Alias) :-
	if(Namespace = Namespace1,
		Alias = Alias1,
		findNamespaceAlias(Namespace, NsList, Alias)).

% Take a term (global), trim it to a given depth, storing the trimmed subterms to the database,
% convert it to local and represent it textually as a string.
termToString(GTerm, VarNames, Depth, NsList, !(Atom)) :-
	trimTerm(GTerm, Depth, TrimmedGTerm, VarNames),
	globalToLocal(TrimmedGTerm, NsList, TrimmedTerm),
	convertTermToWritable(TrimmedTerm, VarNames, WTerm),
	with_output_to(atom(Atom), write_term(current_output, WTerm, [quoted(false)])).

trimTerm(Term, Depth, TrimmedTerm, VarNames) :-
	if(nonCompoundTerm(Term),
		TrimmedTerm = Term,
		( % else
			if(Depth = 0,
				(
					storeTrimmedSubterm(Term, ID, VarNames),
					TrimmedTerm = $ID
				),
				( % else
					Term =.. [Func | Args],
					NewDepth is Depth - 1,
					trimTerms(Args, NewDepth, TrimmedArgs, VarNames),
					TrimmedTerm =.. [Func | TrimmedArgs]
				))
		)).

trimTerms([], _, [], _).
trimTerms([Term | Terms], Depth, [TrimmedTerm | TrimmedTerms], VarNames) :-
	trimTerm(Term, Depth, TrimmedTerm, VarNames),
	trimTerms(Terms, Depth, TrimmedTerms, VarNames).


storeTrimmedSubterm(Term, ID, VarNames) :-
	uniqueTrimmedID(ID),
	assert(storedTrimmedSubterm(ID, Term, VarNames)).

uniqueTrimmedID(ID) :-
	if(retract(lastTrimmedID(LastID)),
		true,
		%else
		LastID = 0),
	ID is LastID + 1,
	assert(lastTrimmedID(ID)).

% Take a string representing a local, potentially trimmed term, and reconstruct the global term it represents.
stringToTerm(!(Atom), NsList, GTerm, VarNames) :-
	atom_to_term(Atom, LTerm, Bindings),
	convertVarNames(Bindings, VarNames1),
	localToGlobal(LTerm, NsList, TrimmedGTerm),
	untrimTerm(TrimmedGTerm, GTerm, VarNames2),
	joinVarNamesByName(VarNames1, VarNames2, VarNames).

untrimTerm(TrimmedTerm, Term, VarNames) :-
	if(nonCompoundTerm(TrimmedTerm),
		(
			Term = TrimmedTerm,
			VarNames = []
		),
		% else
		if(TrimmedTerm = $ID,
			storedTrimmedSubterm(ID, Term, VarNames),
			% else
			(
				TrimmedTerm =.. [Func | TrimmedArgs],
				untrimTerms(TrimmedArgs, Args, VarNames),
				Term =.. [Func | Args]
			))).

untrimTerms([], [], []).
untrimTerms([TrimmedArg | TrimmedArgs], [Arg | Args], VarNames) :-
	untrimTerm(TrimmedArg, Arg, VarNames1),
	untrimTerms(TrimmedArgs, Args, VarNames2),
	joinVarNamesByName(VarNames1, VarNames2, VarNames).

joinVarNamesByName([], VarNames, VarNames).
joinVarNamesByName(['builtin#varName'(Var::_, Name) | VarNames1], VarNames2, VarNames) :-
	if(member('builtin#varName'(Var::_, Name), VarNames2),
		joinVarNamesByName(VarNames1, VarNames2, VarNames),
		% else
		joinVarNamesByName(VarNames1, ['builtin#varName'(Var::_, Name) | VarNames2], VarNames)).

% Test: readFile(!('grammar-example.ced'), !(gram), 'builtin#fileContent'([_, _, 'builtin#statement'(T, V) | _], N)), termToString(T, V, 3, N, S).




% Query protocol
qryStart :-
    write('*\n'),
    read(Query),
    qryContinue(Query).
qryContinue(end_of_file) :-
    !.
qryContinue(Query) :-
    catch(qryHandleQuery(Query), Exception, handleException(Exception)),
    read(NewQuery),
    qryContinue(NewQuery).
    
qryHandleQuery(query(Pattern, Goal)) :-
    call(Goal),
    write(-),
    write_term(Pattern, [ignore_ops(true), quoted(true)]),
    nl,
    fail.
qryHandleQuery(_) :-
    write('.'),
    nl.
handleException(Exception) :-
    write('!'),
    write_term(Exception, [ignore_ops(true), quoted(true)]),
    nl.

% Generate a file based on results from a query
generateFile(!FileName, !StrVar, Goal) :-
	open(FileName, write, S),
	generateLines(S, StrVar, Goal),
	close(S).

generateLines(S, StrVar, Goal) :-
	Goal,
	write(S, StrVar),
	nl(S),
	fail.

generateLines(_, _, _).

% The basics
'builtin#true' :- true.
'builtin#fail' :- fail.
'builtin#equals'(A::_, B::_) :- A == B.
'builtin#if'(C, T, E) :- if(C, T, E).
'builtin#if'(C, T) :- if(C, T).
'builtin#var'(V::_) :- var(V).
'builtin#number'(N::_) :- number(N).
'builtin#string'(!(Atom)::_) :- atom(Atom).
'builtin#compound'(Term::_) :- \+var(Term), \+number(Term), \+(Term = !(_)).
'builtin#parseTerm'(TTerm, Func, TArgs) :- parseTerm(TTerm, Func, TArgs).
'builtin#succ'(X, XPlus1) :- if(var(XPlus1), XPlus1 is X+1, X is XPlus1 - 1).
'builtin#length'(List, _Type, Len) :- length(List, Len).
'builtin#charCodes'(!(Atom), Codes) :- atom_codes(Atom, Codes).
'builtin#strcat'(!S1, !S2, !S3) :- atom_concat(S1, S2, S3).
'builtin#throw'(Exception) :- throw(Exception).
'builtin#catch'(Goal, Exception, AltGoal) :- catch(Goal, Exception, AltGoal).
'builtin#findall'(Template, _Type, Goal, List) :- findall(Template, Goal, List).
'builtin#safeUnify'(A, B) :- unify_with_occurs_check(A,B).
'builtin#termToString'(GTerm::_, VarNames, Depth, NsList, String) :-  termToString(GTerm, VarNames, Depth, NsList, String).
'builtin#ground'(Term::_) :- ground(Term).
'builtin#plus'(A,B,C) :- C is A+B.
'builtin#minus'(A,B,C) :- C is A-B.
'builtin#mult'(A,B,C) :- C is A*B.
'builtin#div'(A,B,C) :- C is A/B.
'builtin#idiv'(A,B,C) :- C is A//B.
'builtin#modulus'(A,B,C) :- C is A mod B.
'builtin#greaterThen'(A,B) :- A>B.
'builtin#coinToss'(N,D) :- N>random(D).
'builtin#copyTerm'(TTermOrig,TTermCopy) :- copy_term(TTermOrig,TTermCopy).
'builtin#structurallyEqual'(TTerm1,TTerm2) :- TTerm1 =@= TTerm2.
'builtin#removeAnnotations'(With, Without) :- removeAnnotations(With, Without).
'builtin#rawTermToString'(Term::_, !String) :- if(var(String), (
						      copy_term(Term, Term1), 
						      numbervars(Term1, 0, _),
						      write_term_to_codes(Term1, Codes, [numbervars(true), ignore_ops(true), quoted(true)]),
						      atom_codes(String, Codes)
						  ), (
						      read_term_from_atom(String, Term, [character_escapes(true)])
						      )).
'builtin#timeout'(Goal, Timeout) :- catch(call_with_time_limit(Timeout, Goal), time_limit_exceeded, throw('builtin#timeout')).

% Write a term to a stream from a term(Term, VarNames) tupple
writeTerm(Stream, Term, VarNames) :-
	convertTermToWritable(Term, VarNames, WTerm),
	write_term(Stream, WTerm, [quoted(false)]),
	write(Stream, '.\n'),
	flush_output(Stream).

% Convert a term(Term, VarNames) tupple into a term to be written without quotes:
% Variables are converted to contain their to their names, atoms are quoted if needed
convertTermToWritable(Var, VarNames, Name) :-
	var(Var),
	findVarName(Var, VarNames, Name),
	!.
convertTermToWritable(Var, _, '_') :-
	var(Var),
	!.
convertTermToWritable(Num, _, Num) :-
	number(Num),
	!.
convertTermToWritable(Term, VarNames, WTerm) :-
	Term =.. [Atom | Args],
	quoteAtomIfNeeded(Atom, QAtom),
	convertTermsToWritable(Args, VarNames, WArgs),
	WTerm =.. [QAtom | WArgs].
	
convertTermsToWritable([], _, []).
convertTermsToWritable([Term | Terms], VarNames, [WTerm | WTerms]) :-
	convertTermToWritable(Term, VarNames, WTerm),
	convertTermsToWritable(Terms, VarNames, WTerms).

% Find the name of a varialbe in a list of Name=Var
findVarName(Var, ['builtin#varName'(Var1::_, !(Name)) | _], Name) :-
	Var == Var1.

findVarName(Var, [_| VarNames], Name) :-
	findVarName(Var, VarNames, Name).

% Check if an atom needs to be quoted
simpleAtom(Atom) :-
	atom_codes(Atom, [First | Rest]),
	First >= 97,
	First =< 122,
	forall(member(Code, Rest), identifierCode(Code)).
	
% Codes that may appear in an unquoted atom
identifierCode(Code) :-
	Code >= 97,
	Code =< 122.
identifierCode(Code) :-
	Code >= 65,
	Code =< 90.
identifierCode(95).

% Quote an atom
quote(Atom, QAtom) :-
	atom_chars(Atom, Chars),
	quoteList(Chars, QChars),
	atom_chars(QAtom, ['\'' | QChars]).

% Quote an atom given as a list of characters
quoteList([], ['\'']).
quoteList(['\'' | Rest], ['\\', '\'' | QRest]) :-
	!,
	quoteList(Rest, QRest).

quoteList([Char | Rest], [Char | QRest]) :-
	quoteList(Rest, QRest).

% Quote if needed
quoteAtomIfNeeded(Atom, Atom) :-
	simpleAtom(Atom),
	!.
quoteAtomIfNeeded(Atom, Atom) :-
	dontConvertFunc(Atom),
	!.
quoteAtomIfNeeded(Atom, QAtom) :-
	quote(Atom, QAtom).

