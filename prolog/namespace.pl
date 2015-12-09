
convert_to_namespace(TermIn, TermOut, _) :-
    var(TermIn), !,
    TermOut = TermIn.
convert_to_namespace(TermIn, TermOut, _) :-
    number(TermIn), !,
    TermOut = TermIn.
convert_to_namespace(!(Str), !(Str), _) :- !.
convert_to_namespace(TermIn, TermOut, Namespace) :-
    TermIn =.. [Name | Args],
    do_not_prefix_name(Name), !,
    convert_to_namespace_list(Args, ArgsOut, Namespace),
    TermOut =.. [Name | ArgsOut].
convert_to_namespace(TermIn, TermOut, Namespace) :-
    TermIn =.. [Name | Args],
    atom_concat(Namespace, Name, NewName),
    convert_to_namespace_list(Args, ArgsOut, Namespace),
    TermOut =.. [NewName | ArgsOut].

convert_to_namespace_list([], [], _).
convert_to_namespace_list([TermIn | TermsIn], [TermOut | TermsOut], Namespace) :-
    convert_to_namespace(TermIn, TermOut, Namespace),
    convert_to_namespace_list(TermsIn, TermsOut, Namespace).

do_not_prefix_name(Name) :- atom_chars(Name, Chars), \+member('#', Chars).
do_not_prefix_name(Name) :- atom_concat('builtin#', _, Name).
do_not_prefix_name(Name) :- atom_concat('annotation#', _, Name).

load_to_namespace(FileName, Namespace) :-
    open(FileName, read, Stream),
    read(Stream, Clause),
    process_stream(Clause, Stream, Namespace).

process_stream(end_of_file, _, _) :- !.
process_stream(Clause, Stream, Namespace) :-
    %convert_to_namespace(Clause, ClauseNS, Namespace),
    '/containers#containerize'(Clause::_, ClauseNS::_, !Namespace),
    assert(ClauseNS),
    read(Stream, Clause2),
    process_stream(Clause2, Stream, Namespace).

call_namespace(Goal, NS) :-
    convert_to_namespace(Goal, GoalNS, NS),
    GoalNS.
