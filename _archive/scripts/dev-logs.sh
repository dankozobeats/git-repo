#!/bin/bash

cd docker
docker-compose -f docker-compose.dev.yml logs -f
