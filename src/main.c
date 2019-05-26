#include <stdlib.h>
#include <stdio.h>

// https://ssl.icu-project.org/apiref/icu4c/
#include <unicode/uloc.h>
#include <unicode/ucurr.h>
#include <unicode/ucnv.h>

int main(int argc, char const *argv[]) {
  int32_t localeCount = uloc_countAvailable();
  size_t currencyLength = sizeof(UChar) * 3;
  UChar* currency = (UChar*) malloc(currencyLength);
  UErrorCode ec = U_ZERO_ERROR;
  UConverter* conv = ucnv_open("ASCII", &ec);

  if (ec != U_ZERO_ERROR) {
    printf("Error in ucnv_open: %s\n", u_errorName(ec));
    return ec;
  }

  printf("Available locales: %i\n", localeCount);

  for(int32_t i = 0; i < localeCount; i++) {
    const char* locale = uloc_getAvailable(i);
    printf("Got locale: %s\n", locale);

    ucurr_forLocale(locale, currency, currencyLength, &ec);
    if (ec != U_ZERO_ERROR) {
      printf("Error in ucurr_forLocale: %s\n", u_errorName(ec));
      continue;
    }

    int32_t currencyAsStringLength = UCNV_GET_MAX_BYTES_FOR_STRING(currencyLength, ucnv_getMaxCharSize(conv));
    char* currencyAsString = malloc(currencyAsStringLength);
    ucnv_fromUChars(conv, currencyAsString, currencyAsStringLength, currency, currencyLength, &ec);

    printf("got currency: %s\n", currencyAsString);

    free(currencyAsString);
  }

  // unumf_openForSkeletonAndLocale
  // UNumberFormatStyle
  // unum_formatDoubleCurrency
  // ucurr_forLocale

  free(currency);

  return 0;
}
