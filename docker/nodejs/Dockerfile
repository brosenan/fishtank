FROM ubuntu:vivid
RUN apt-get -y update
RUN apt-get -y install build-essential libssl-dev curl
RUN apt-get -y install swi-prolog
RUN mkdir /nodejs
WORKDIR /nodejs
RUN curl https://nodejs.org/dist/v5.2.0/node-v5.2.0-linux-x64.tar.gz | tar xzv --strip-components=1
RUN mkdir /project
WORKDIR /project
ENV PATH $PATH:/nodejs/bin
ENV npm_config_unsafe_perm=1

