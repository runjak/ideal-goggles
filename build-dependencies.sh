#!/bin/bash
set -ue

cd glibc-build
../glibc/configure --prefix=$PWD/../glibc-install
make install
cd ..

cd icu/icu4c/source
./configure --prefix=$PWD../../../icu-install
make install
cd ../../..
