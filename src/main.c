#include <stdio.h>

// https://ssl.icu-project.org/apiref/icu4c/
#include <unicode/uloc.h>
// #include "../icu/icu4c/source/common/unicode/uloc.h"

// #include "../icu/icu4c/source/common/unicode/locid.h"
// #include <locid.h>

int main(int argc, char const *argv[])
{
  printf("Hello locales!\n");

  int foo = uloc_countAvailable();

  printf("Things: %i\n", foo);

  return 0;
}
