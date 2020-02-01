FROM node:latest
RUN apt-get -q update && apt-get -qy install netcat
# Yarn is included in the latest node images
# if you are using one which does not include it, uncomment
# the following line:
# RUN npm -g install yarn
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN yarn install && yarn link
RUN yarn --cwd /usr/src/app/public/app install && yarn --cwd /usr/src/app/public/app build
EXPOSE 8080
