#!/bin/bash

docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"
docker build -t slidewiki/searchservice ./
docker push slidewiki/searchservice:latest-dev
