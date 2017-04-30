FROM mhart/alpine-node:latest

RUN npm i @mrgalaxy/shorturl -g

ENV PORT=8080
EXPOSE $PORT

VOLUME ["/etc/shorturl"]
ENTRYPOINT [ "shorturl-server", "--host", "0.0.0.0" ]
