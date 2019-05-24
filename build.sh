#!/bin/bash
cd glibc-build
../glibc/configure --prefix=$(pwd)
make
