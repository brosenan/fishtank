#!/bin/sh

docker run --name redis -d redis
docker run --name mongo -d mongo:2.6
docker run --name rabbitmq -d rabbitmq
docker run -d --name fakes3 fakes3
