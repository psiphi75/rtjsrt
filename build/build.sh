#!/usr/bin/env bash

WWW_DIR="www"

#
# Tidy Up
#

mkdir -p "${WWW_DIR}"
rm ${WWW_DIR}/*js

#
# Build the Web Main JS files
#

MAIN_JS="run-client.js src/Physics.js src/Constants.js src/FPSTimer.js src/ManageRayTracing.js src/Objects.js src/RayTracer.js src/Vector.js src/WorkerManager.js"


browserify ${MAIN_JS} -o ${WWW_DIR}/bundle.js


#
# Build the Web Workers JS files
#

WORKER_JS="src/RayTraceWorker.js  src/RayTracer.js  src/Constants.js"
browserify ${WORKER_JS}   -o ${WWW_DIR}/RayTraceWorker.js
