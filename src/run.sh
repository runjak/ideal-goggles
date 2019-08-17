#!/bin/bash
set -ue

rm ideal-goggles || true
./build.sh
./ideal-goggles

