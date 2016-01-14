FROM brosenan/nodalion
RUN apt-get install -y git
WORKDIR /
RUN git clone https://github.com/brosenan/cloudlog1.git
EXPOSE 80
WORKDIR /clouglog1
CMD node server.js
