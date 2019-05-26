#include <stdlib.h>
#include <stdio.h>

// https://ssl.icu-project.org/apiref/icu4c/
#include <unicode/uloc.h>
#include <unicode/ucurr.h>
#include <unicode/ucnv.h>

int main(int argc, char const *argv[]) {
  int32_t localeCount = uloc_countAvailable();
  size_t currencyLength = sizeof(UChar) * 3;
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
  }

  UEnumeration* currencies = ucurr_openISOCurrencies(UCURR_ALL|UCURR_NON_DEPRECATED, &ec);
  if (ec != U_ZERO_ERROR) {
    printf("Error in ucurr_openISOCurrencies: %s\n", u_errorName(ec));
    return ec;
  }

  int32_t currencyCount = uenum_count(currencies, &ec);
  printf("Got currencies: %i\n", currencyCount);

  const char* currency = NULL;
  while ((currency = uenum_next(currencies, NULL, &ec))) {
    printf("Got currency: %s\n", currency);
  }
  uenum_reset(currencies, &ec);

  uenum_close(currencies);

  return 0;
}
