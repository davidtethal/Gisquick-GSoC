#!/bin/sh

mkdir -p tmp

cp ../../server/requirements.txt tmp/
cp ../../server/dist/gisquick-dev.tar.gz tmp/

docker build -t gisquick/django:raster .

# rm -r tmp/
