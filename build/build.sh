#!/usr/bin/env bash

WWW_DIR="www"
INPUT_JS="src/*.js  run-client.js"
OUTPUT_JS="${WWW_DIR}/bundle.js"

rm ${WWW_DIR}/*js

#
# Build the Web JS files
#

mkdir -p "${WWW_DIR}"
browserify ${INPUT_JS}  -o ${OUTPUT_JS}
cp tests/worker.js www/
