FROM brosenan/nodalion
RUN apt-get install -y git
WORKDIR /
RUN git clone https://github.com/brosenan/cloudlog1.git
WORKDIR /cloudlog1
RUN npm install
RUN mkdir -p /var/lib/storage/cloudlog
EXPOSE 80
CMD while :; do node server.js; echo reviving in 1 second; sleep 1; done

