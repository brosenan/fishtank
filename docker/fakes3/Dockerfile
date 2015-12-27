FROM ubuntu:vivid
RUN apt-get -y update
RUN apt-get -y install ruby
RUN gem install fakes3
VOLUME /var/lib/fakes3-root

EXPOSE 80
CMD fakes3 -r /var/lib/fakes3-root -p 80
