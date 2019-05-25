#include <stdio.h>

// https://ssl.icu-project.org/apiref/icu4c/
#include <unicode/uloc.h>

int main(int argc, char const *argv[])
{
  printf("Hello locales!\n");

  int32_t localeCount = uloc_countAvailable();

  printf("Available locales: %i\n", localeCount);

  for(int32_t i = 0; i < localeCount; i++) {
    printf("Got locale: %s\n", uloc_getAvailable(i));
  }

  return 0;
}
