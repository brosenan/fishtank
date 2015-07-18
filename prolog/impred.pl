:- [service, cedalion].
:- dynamic storedTerm/2.

go :- read(Cmd),
      catch(mustSucceed(handleCmd(Cmd, Continue)), Error, handleError(Error)),
      Continue = yes,
      go.

handleCmd(end_of_file, no) :- !.
handleCmd(eval(Res, Impred), yes) :- !, evalImpred(Res, Impred).
handleCmd(cont(ID, RetVal), yes) :- !, continue(ID, RetVal).
handleCmd(throwInto(ID, Exception), yes) :- !, throwInto(ID, Exception).
handleCmd(Cmd, _) :- throw(bad_command(Cmd)).

handleError(Error) :- write('! '), writeTerm(Error), nl, write('.'), nl.

evalImpred(Res, Impred) :-
    forall('/impred#solve'(Impred,Res,_,Resp), writeResponse(Resp)),
    write('.'), nl.

writeResponse('/impred#solution'(Value)) :- write(': '), writeTerm(Value), nl.
writeResponse('/impred#continuation'(Task,RetVal,RetType,Continuation,Res)) :- 
    storeTerm(cont(RetVal, Continuation, Res), ID),
    write('? '), write(ID), write(' '), writeTerm(Task), nl.
writeResponse('/impred#throws'(Value)) :- write('! '), writeTerm(Value), nl.

runTests :-
    forall('/bootstrap#testHasFailed'(Test, _, File, Result), (write(File), write(': '), write(Test), write(' --> '), write(Result), nl)).

storeTerm(Term, ID) :-
    chooseID(ID),
    assert(storedTerm(ID, Term)).

chooseID(ID) :-
    random_between(0, 2000000000, ID),
    \+ storedTerm(ID, _), !.
chooseID(ID) :- chooseID(ID).

continue(ID, RetVal) :-
    retract(storedTerm(ID, cont(RetVal, Continuation, Res))),
    evalImpred(Res, Continuation).

throwInto(ID, Exception) :-
    retract(storedTerm(ID, cont(RetVal, Continuation, Res))),
    forall('/impred#throwInto'(Continuation, Exception, Resp, RetVal, _), writeResponse(Resp)),
    write('.'), nl.

mustSucceed(Goal) :-
    Goal, !.
mustSucceed(Goal) :-
    throw(failed(Goal)).

writeTerm(Term) :-
    write_term(Term, [quoted(true), ignore_ops(true)]).
