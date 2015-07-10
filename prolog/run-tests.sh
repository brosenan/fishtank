#!/bin/sh
dir=`dirname $0`
swipl -f $dir/impred.pl -t runTests
