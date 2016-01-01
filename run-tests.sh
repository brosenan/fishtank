#!/bin/sh
docker run -i -v $PWD:/project --link=mongo --link=rabbitmq --link=fakes3 -v /tmp:/tmp nodejs npm test
