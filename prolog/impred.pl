:- [service, cedalion].

go :- read(Cmd),
      catch(handleCmd(Cmd, Continue), Error, handleError(Error)),
      Continue = yes,
      go.

handleCmd(end_of_file, no) :- !.
handleCmd(eval(Res, Impred), yes) :- !, evalImpred(Res, Impred).
handleCmd(Cmd, _) :- throw(bad_command(Cmd)).

handleError(Error) :- write('! '), write(Error), nl.

evalImpred(Res, Impred) :-
    forall('/impred#solve'(Impred,Res,_,Resp), writeResponse(Resp)),
    write('.'), nl.

writeResponse('/impred#solution'(Value)) :- write(': '), write_term(Value, []), nl.
writeResponse('/impred#continuation'(Task,RetVal,RetType,Continuation,Res)) :- write('? '), write_term(cont(Task, RetVal, Continuation, Res), []), nl.
