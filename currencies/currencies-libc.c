#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <locale.h>
#include <monetary.h>
#include <string.h>

void strConcat(char *dest, size_t destLength, const char *src1, const char *src2) {
  memset(dest, 0, destLength);
  strcat(dest, src1);
  strcat(dest, src2);
}

int main(int argc, char const *argv[]) {
  const size_t bufferSize = 256;

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

  char* utf8Suffix = ".UTF-8";
  for (int localeIndex = 1; localeIndex < argc; localeIndex++) {
    size_t libcLocaleLength = strlen(argv[localeIndex]) + strlen(utf8Suffix) + 1;
    char libcLocale[libcLocaleLength];
    strConcat(libcLocale, libcLocaleLength, argv[localeIndex], utf8Suffix);

    char *selectedLibcLocale = setlocale(LC_MONETARY, libcLocale);
    if (selectedLibcLocale == NULL) {
      printf("%s\30", argv[localeIndex]);
      continue;
    }

    for (uint8_t testAmountIndex = 0; testAmountIndex < testAmountsCount; testAmountIndex++) {
      double testAmount = testAmounts[testAmountIndex];

      char libcFormatted[bufferSize];
      strfmon(libcFormatted, bufferSize, "%n", testAmount);

      printf("%s\31%f\31%s\30", argv[localeIndex], testAmount, libcFormatted);
    }
  }

  return 0;
}
