FROM mhart/alpine-node:latest

RUN apk update && apk upgrade \
	&& apk add --no-cache git make gcc g++ python

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app
COPY *.js /usr/src/app/
COPY dist /usr/src/app/
COPY package.json /usr/src/app/
RUN [ "npm", "install", "--production" ]

# run app
EXPOSE 8080
CMD [ "npm", "start" ]
