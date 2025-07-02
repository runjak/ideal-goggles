#!/bin/bash
set -ue

LDSO=($PWD/../glibc-install/lib/ld*.so*)

clang \
  -nodefaultlibs -nostdinc \
  -I../glibc-install/include \
  -I/usr/lib/clang/20/include \
  -L../glibc-install/lib \
  -Wl,-rpath='$ORIGIN'/../glibc-install/lib \
  -lc \
  -Wl,--dynamic-linker=${LDSO[0]} \
  currencies-libc.c -o currencies-libc
