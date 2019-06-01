#include <stdlib.h>
#include <stdio.h>
#include <locale.h>
#include <monetary.h>
#include <string.h>

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

void strConcat(char *dest, size_t destLength, const char *src1, const char *src2) {
  memset(dest, 0, destLength);
  strcat(dest, src1);
  strcat(dest, src2);
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

  char* utf8Suffix = ".UTF-8";

  for (int32_t i = 0; i < localeCount; i++) {
    const char *icuLocale = uloc_getAvailable(i);

    UChar icuCurrency[currencyLength];
    ucurr_forLocale(icuLocale, icuCurrency, currencyLength, &ec);
    breakOnError(ec);

    size_t libcLocaleLength = strlen(icuLocale) + strlen(utf8Suffix) + 1;
    char libcLocale[libcLocaleLength];
    strConcat(libcLocale, libcLocaleLength, icuLocale, utf8Suffix);

    char *selectedLibcLocale = setlocale(LC_MONETARY, libcLocale);

    if (selectedLibcLocale == NULL) {
      printf("No libc LC_MONETARY for %s\n", libcLocale);
      continue;
    }

    // char *libcLocale = setlocale(LC_MONETARY, "en_US.UTF-8");
    // printf("%i: %s -> %s => %s\n", i, icuLocale, libcLocale, selectedLibcLocale);
  }

#if 0
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
#endif

#if 0
  char *selectedLocale = setlocale(LC_MONETARY, "en_US.UTF-8");
  printf("Selected locale: %s\n", selectedLocale);

  char buf[100];
  strfmon(buf, 100, "%n", 123.45);

  printf("Money? %s\n", buf);
#endif

  return 0;
}
