#include <stdlib.h>
#include <stdio.h>

// https://ssl.icu-project.org/apiref/icu4c/
#include <unicode/uloc.h>
#include <unicode/ucurr.h>
#include <unicode/ucnv.h>
#include <unicode/unum.h>
#include <unicode/ustring.h>

void breakOnError(UErrorCode ec) {
  if(ec != U_ZERO_ERROR) {
    printf("Got UErrorCode: %s\n", u_errorName(ec));

    if (ec > 0) {
      exit(ec);
    }
  }
}

int main(int argc, char const *argv[]) {
  int32_t localeCount = uloc_countAvailable();
  size_t currencyLength = sizeof(UChar) * 3;
  UErrorCode ec = U_ZERO_ERROR;
  UConverter *conv = ucnv_open("ASCII", &ec);

  if (ec != U_ZERO_ERROR) {
    printf("Error in ucnv_open: %s\n", u_errorName(ec));
    return ec;
  }

  printf("Available locales: %i\n", localeCount);

  for (int32_t i = 0; i < localeCount; i++) {
    const char *locale = uloc_getAvailable(i);
    printf("%i: %s\n", i, locale);
  }

  UEnumeration *currencies = ucurr_openISOCurrencies(UCURR_ALL|UCURR_NON_DEPRECATED, &ec);
  if (ec != U_ZERO_ERROR) {
    printf("Error in ucurr_openISOCurrencies: %s\n", u_errorName(ec));
    return ec;
  }

  int32_t currencyCount = uenum_count(currencies, &ec);
  printf("Got currencies: %i\n", currencyCount);

  int i = 0;
  const char *currency = NULL;
  while ((currency = uenum_next(currencies, NULL, &ec))) {
    printf("Got currency (%i): %s\n", i, currency);
    i++;
  }
  uenum_reset(currencies, &ec);

  uenum_close(currencies);

  UNumberFormat *numberFormat = unum_open(UNUM_CURRENCY, NULL, -1, "fr_CH", NULL, &ec);
  breakOnError(ec);

  const size_t bufferSize = 256;

  UChar uCurrencyName[bufferSize];
  u_strFromUTF8(uCurrencyName, bufferSize, NULL, "CHF", -1, &ec);
  breakOnError(ec);

  UChar buffer[bufferSize];
  int32_t bufferUsed = unum_formatDoubleCurrency(numberFormat, -1234.56, uCurrencyName, buffer, bufferSize, NULL, &ec);

  char outputBuffer[bufferSize];
  u_strToUTF8(outputBuffer, bufferSize, NULL, buffer, -1, &ec);
  breakOnError(ec);

  printf("DRAGONS: %s\n", outputBuffer);
  // unum_formatDoubleCurrency

  return 0;
}
