FROM ubuntu:vivid
RUN apt-get -y update
RUN apt-get -y install ruby
RUN gem install fakes3
RUN sed -i "s/\(raise new Error .* unless part.* == etag\)/#\1/" /var/lib/gems/2.1.0/gems/fakes3-0.2.2/lib/fakes3/file_store.rb
VOLUME /var/lib/fakes3-root

EXPOSE 80
CMD fakes3 -r /var/lib/fakes3-root -p 80
