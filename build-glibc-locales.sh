#!/bin/bash
set -ue

mkdir -p ./glibc-install/lib/locale

locales=$(find glibc-install/share/i18n/locales -type f | cut -d '/' -f5-)

for locale in $locales
do
  echo "localedef for ${locale}"
  ./glibc-install/bin/localedef -i ${locale} -c -f UTF-8 -A ./glibc-install/share/locale/locale.alias ${locale}.UTF-8 || true
done

