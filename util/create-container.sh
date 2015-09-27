#!/bin/sh

set -e

container=$1
if [ "'x$container'" == x ]; then
    $container=cloudlog1
fi

remote=cl_images
packages='mongodb redis-server swi-prolog git build-essential libssl-dev curl'
user=cloudlog
release=vivid
arch=amd64
state=.state-$container
EXEC="lxc exec $container bash"
EXEC_AS_USER="lxc exec $container su - $user"

mkdir -p $state

if [ ! -f $state/created-container ]; then
    lxc remote add $remote images.linuxcontainers.org || echo skipped
    lxc launch $remote:ubuntu/$release/$arch $container
    echo Waiting for container to go up...
    sleep 10
    touch $state/created-container
fi
if [ ! -f $state/apt-get-update ]; then
    echo apt-get update | $EXEC
    touch $state/apt-get-update
fi
if [ ! -f $state/apt-get-install ]; then
    echo apt-get --yes install $packages | $EXEC
    touch $state/apt-get-install
fi

if [ ! -f $state/create-user ]; then
    echo adduser --disabled-password --gecos "''" $user | $EXEC
    touch $state/create-user
fi

if [ ! -f $state/nodejs ]; then
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.26.1/install.sh | $EXEC_AS_USER
    echo "echo . ~/.nvm/nvm.sh >> ~/.profile" | $EXEC_AS_USER
    echo nvm install 0.12 | $EXEC_AS_USER
    echo nvm alias default 0.12 | $EXEC_AS_USER
    touch $state/nodejs
fi

if [ ! -f $state/cloudlog1 ]; then
    echo rm -rf cloudlog1 | $EXEC_AS_USER || echo skipped
    echo git clone https://github.com/brosenan/cloudlog1.git | $EXEC_AS_USER
    echo cd cloudlog1 ';' npm install | $EXEC_AS_USER
    echo cd cloudlog1 ';' npm test | $EXEC_AS_USER
    touch $state/cloudlog1
fi
