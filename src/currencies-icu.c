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

  int32_t localeCount = uloc_countAvailable();
  UErrorCode ec = U_ZERO_ERROR;
  char* utf8Suffix = ".UTF-8";

  for (int32_t i = 0; i < localeCount; i++) {
    const char *icuLocale = uloc_getAvailable(i);
    UNumberFormat *icuNumberFormat = unum_open(UNUM_CURRENCY, NULL, -1, icuLocale, NULL, &ec);
    if (ec != U_USING_DEFAULT_WARNING) {
      breakOnError(ec);
    }

    const size_t bufferSize = 256;

    UChar uCurrencyName[bufferSize];
    unum_getTextAttribute(icuNumberFormat, UNUM_CURRENCY_CODE, uCurrencyName, bufferSize, &ec);
    if (ec != U_USING_DEFAULT_WARNING) {
      breakOnError(ec);
    }

    for (uint8_t testAmountIndex = 0; testAmountIndex < testAmountsCount; testAmountIndex++) {
      double testAmount = testAmounts[testAmountIndex];

      UChar icuFormattedU[bufferSize];
      int32_t bufferUsed = unum_formatDoubleCurrency(icuNumberFormat, testAmount, uCurrencyName, icuFormattedU, bufferSize, NULL, &ec);
      if (ec != U_USING_FALLBACK_WARNING && ec != U_USING_DEFAULT_WARNING) {
        breakOnError(ec);
      }
      char icuFormatted[bufferSize];
      u_strToUTF8(icuFormatted, bufferSize, NULL, icuFormattedU, -1, &ec);
      if (ec != U_USING_FALLBACK_WARNING && ec != U_USING_DEFAULT_WARNING) {
        breakOnError(ec);
      }

      printf("%s\31%f\31%s\30", icuLocale, testAmount, icuFormatted);
    }
  }

  return 0;
}
