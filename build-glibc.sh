#!/bin/bash
set -ue

# https://sourceware.org/glibc/wiki/libmvec
# -> --disable-mathvec

cd glibc-build
../glibc/configure --prefix=$PWD/../glibc-install
make all
make install
cd ..
