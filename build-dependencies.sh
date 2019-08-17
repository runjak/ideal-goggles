#!/bin/bash
set -ue

./build-glibc.sh
./build-icu.sh
./build-glibc-locales.sh
