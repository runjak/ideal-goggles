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
  uint8_t testAmountsCount = 11 * 2;
  double testAmounts[testAmountsCount];
  testAmounts[0] = 0;
  testAmounts[1] = 123456789;
  for (uint8_t i = 2; i < testAmountsCount; i++) {
    double x = -testAmounts[i-1];

    if (i%2 == 0) {
      x /= 10;
    }

    testAmounts[i] = x;
  }

  printf("Using testAmounts:\n------------------\n\n```c\n");
  for (uint8_t i = 0; i < testAmountsCount; i++) {
    printf("testAmounts[%i] = %f\n", i, testAmounts[i]);
  }
  printf("```\n");

  int32_t localeCount = uloc_countAvailable();
  UErrorCode ec = U_ZERO_ERROR;
  char* utf8Suffix = ".UTF-8";

  printf("\nIterating %i icu locales:\n--------------------------\n\n", localeCount);

  for (int32_t i = 0; i < localeCount; i++) {
    const char *icuLocale = uloc_getAvailable(i);
    UNumberFormat *icuNumberFormat = unum_open(UNUM_CURRENCY, NULL, -1, icuLocale, NULL, &ec);
    breakOnError(ec);

    size_t libcLocaleLength = strlen(icuLocale) + strlen(utf8Suffix) + 1;
    char libcLocale[libcLocaleLength];
    strConcat(libcLocale, libcLocaleLength, icuLocale, utf8Suffix);

    char *selectedLibcLocale = setlocale(LC_MONETARY, libcLocale);
    if (selectedLibcLocale == NULL) {
      printf("LC_MONETARY missing for libcLocale: %s\n", libcLocale);
      continue;
    }

    const size_t bufferSize = 256;

    UChar uCurrencyName[bufferSize];
    u_strFromUTF8(uCurrencyName, bufferSize, NULL, "CHF", -1, &ec);
    breakOnError(ec);

    for (uint8_t testAmountIndex = 0; testAmountIndex < testAmountsCount; testAmountIndex++) {
      double testAmount = testAmounts[testAmountIndex];

      UChar icuFormattedU[bufferSize];
      int32_t bufferUsed = unum_formatDoubleCurrency(icuNumberFormat, testAmount, uCurrencyName, icuFormattedU, bufferSize, NULL, &ec);
      char icuFormatted[bufferSize];
      u_strToUTF8(icuFormatted, bufferSize, NULL, icuFormattedU, -1, &ec);
      breakOnError(ec);

      char libcFormatted[bufferSize];
      strfmon(libcFormatted, bufferSize, "%n", 123.45);

      int comparison = strcmp(icuFormatted, libcFormatted);
      if (comparison == 0) {
        printf("Locale %s yields same strings: %s, %s\n", icuLocale, icuFormatted, libcFormatted);
      }
    }
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
  #endif

  return 0;
}
