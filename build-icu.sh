#!/bin/bash
set -ue

cd icu-build
../icu/icu4c/source/configure --prefix=$PWD/../icu-install
make install
cd ..
