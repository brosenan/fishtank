:- [service, cedalion, uuid].
:- dynamic storedTerm/2, localStore/2.

go :- read(Cmd),
      catch(mustSucceed(handleCmd(Cmd, Continue)), Error, handleError(Error)),
      Continue = yes,
      go.

handleCmd(end_of_file, no) :- !.
handleCmd(eval(Res, Impred), yes) :- !, evalImpred(Res, Impred), write('.'), nl.
handleCmd(cont(ID, RetVal), yes) :- !, continue(ID, RetVal).
handleCmd(throwInto(ID, Exception), yes) :- !, throwInto(ID, Exception).
handleCmd(Cmd, _) :- throw(bad_command(Cmd)).

handleError(Error) :- write('! '), writeTerm(Error), nl, write('.'), nl.

evalImpred(Res, Impred) :-
    forall('/impred#solve'(Impred,Res,_,Resp), handleResponse(Resp)).

handleResponse('/impred#solution'(Value)) :- write(': '), writeTerm(Value), nl.
handleResponse('/impred#continuation'(Task,RetVal,RetType,Continuation,Res)) :-
    handleContinuation(Task, RetVal, Continuation, Res).
handleResponse('/impred#throws'(Value)) :- write('! '), writeTerm(Value), nl.

handleContinuation(Task, RetVal, Continuation, Res) :-
    handleTask(Task, RetVal), !,
    evalImpred(Res, Continuation).
handleContinuation(Task, RetVal, Continuation, Res) :-
    storeTerm(cont(RetVal, Continuation, Res), ID),
    write('? '), write(ID), write(' '), writeTerm(Task), nl.


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
    evalImpred(Res, Continuation),
    write('.'), nl.

throwInto(ID, Exception) :-
    retract(storedTerm(ID, cont(RetVal, Continuation, Res))),
    forall('/impred#throwInto'(Continuation, Exception, Resp, RetVal, _), handleResponse(Resp)),
    write('.'), nl.

mustSucceed(Goal) :-
    Goal, !.
mustSucceed(Goal) :-
    throw(failed(Goal)).

writeTerm(Term) :-
    write_term(Term, [quoted(true), ignore_ops(true)]).

handleTask('/impred#localGet'(!Key), Value) :-
    ignore(localStore(Key, Value)).
handleTask('/impred#localSet'(!Key, Value), OldValue) :-
    ignore(retract(localStore(Key, OldValue))),
    assert(localStore(Key, Value)).

handleTask('/impred#now', Timestamp) :-
    get_time(Timestamp).

handleTask('/impred#uuid', !UUID) :-
    uuid(UUID).
