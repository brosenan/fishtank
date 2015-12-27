#!/bin/sh
docker run -it -v $PWD:/project --link=mongo --link=rabbitmq nodejs npm test
