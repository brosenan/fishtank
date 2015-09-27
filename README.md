# cloudlog1
cloudlog1 is a [deductive database](https://en.wikipedia.org/wiki/Deductive_database) based on the Cloudlog language.  Unlike most deductive databases, that are based on the [Datalog](https://en.wikipedia.org/wiki/Datalog) language, cloudlog1 is a "NoDatalog" database, designed for the 21st century.

## Datalog and NoDatalog
Deductive databases store axioms, which can be either facts or rules, and allow querying conclusions that can be drawn from these axioms.

Datalog is based on [Prolog](https://en.wikipedia.org/wiki/Prolog), but restricted in a few ways:

2. Recursion is restricted to what they call "stratification".
1. Predicates are assumed to only get primitive type arguments, such as numbers and strings, and cannot take compound terms.

These restrictions allowed efficient implementation of databases back when databases were on a single machine, but during these days, they could not compete with SQL databases.

Nowadays, [NoSQL](https://en.wikipedia.org/wiki/NoSQL) databases are taking more and more of the database landscape, mostly thanks to their scalability and high availability, which comes at the expense of looser consistency and a simpler (and less capable) data model.

NoDatalog presents similar trade-offs in the deductive database arena.  They are designed to scale way beyond a single machine, but in exchange require users to be aware of some scalability considerations.

## Cloudlog
Cloudlog is a language designed for such databases.  It is similar to Prolog, but has different syntax for top-down vs. bottom-up deductions.  Top-down evaluation (with rules of the form B <- A, similar to B :- A in Prolog and Datalog) starts when the user makes a query.  This is often too late to do fancy stuff, because we do not want to keep the user waiting.  However, some things can only be performed when we know the query, so top-down evaluation is necessary.  

Bottom up evaluation (using rules of the form A -> B) occurs when changes are made to the content of the database, that is, when facts and rules are being added or removed.  The database evaluates these rules until reaching a steady state.  To assure a steady state is always reached, recursion is not allowed for bottom-up rules.  Bottom-up rules are excelent for converting facts from one form to another, to allow fast query.  They are also good for performing ahead-of-time joins.  They provide a declarative way to perform [denormalization](https://en.wikipedia.org/wiki/Denormalization) of the data.

## Design
cloudlog1 is a concrete database project that implements the Cloudlog language.  It is implemented as a front-end that stores its data in two NoSQL databases:

1. [MongoDB](https://www.mongodb.org), used for storing the axioms.
2. [Redis](http://redis.io), used to store book-keeping information about transactions.

Both databases are used through abstractions, so that they can be replaced with other databases providing similar capabilities.  For example, the abstraction we used around MongoDB is actually based on BigTable (or HBase), using wide-column terminology, and not documents.  This allows users to choose a different back-end database without changing any existing code (we hope)...

## Implementation
cloudlog1 is a work in progress, and is not currently a working database.

It is written in three languages:
1. Javascript (es6) over [Node.js](https://nodejs.org/en) -- providing the runtime environment as well as drivers for external systems (such as databases and HTTP).
2. Prolog ([swi-prolog](http://www.swi-prolog.org/)) -- providing another part of the runtime environment.
3. [Cedalion](http://cedalion.org) -- this is how most of the database is implemented.
