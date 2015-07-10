#!/bin/sh
grep -v fail cedalion.pl | grep -v loadedStatement | sed "s/'[^#]*#\([^']*\)'/\1/g"| less
