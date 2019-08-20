#!/bin/bash
set -ue

clang \
  -I../icu-install/include \
  -L../icu-install/lib \
  -licui18n -licuuc -licudata \
  -Wl,-rpath='$ORIGIN'/../icu-install/lib \
  currencies-icu.c -o currencies-icu
