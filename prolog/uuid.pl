uuid(UUID) :-
    random(0, 10000000000000000000000000000000000000000000, Rand),
    uuid_codes(Rand, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', Chars),
    atom_chars(UUID, Chars).

uuid_codes(Rand, _, []) :-
    Rand < 64, !.

uuid_codes(Rand, Base64, [Char | Chars]) :-
    Mod is Rand mod 64,
    Div is Rand // 64,
    sub_atom(Base64, Mod, 1, _, Char),
    uuid_codes(Div, Base64, Chars).
