#!/usr/bin/env bash

WWW_DIR="www"
INPUT_JS="src/*.js  run-client.js"
OUTPUT_JS="${WWW_DIR}/bundle.js"

rm ${OUTPUT_JS}

#
# Build the Web JS files
#

mkdir -p "${WWW_DIR}"
browserify ${INPUT_JS}  -o ${OUTPUT_JS}

#
# Closure Compiler
#

java -jar build/cc/compiler.jar                     \
        --js ${OUTPUT_JS}                           \
        --js_output_file ${OUTPUT_JS}               \
        --create_source_map ${OUTPUT_JS}.map        \
        --compilation_level ADVANCED_OPTIMIZATIONS
