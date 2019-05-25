#!/bin/bash
set -ue

clang \
  -nodefaultlibs -nostdinc \
  -I../glibc-install/include \
  -I/usr/lib/clang/8.0.0/include \
  -L../glibc-install/lib \
  -Wl,-rpath='$ORIGIN'/../glibc-install/lib \
  -lc \
  -I../icu-install/include \
  -L../icu-install/lib \
  -licui18n -licuuc -licudata \
  -Wl,-rpath='$ORIGIN'/../icu-install/lib \
  main.c -o ideal-goggles