#!/bin/bash
set -ue

cd glibc-build
../glibc/configure --prefix=$PWD/../glibc-install
make all
make install
cd ..
