import glob from 'glob';
import path from 'path';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import uniq from 'lodash/uniq';
import partition from 'lodash/partition';
import zip from 'lodash/zip';
import every from 'lodash/every';
import sortBy from 'lodash/sortBy';
import pick from 'lodash/pick';
import concat from 'lodash/concat';

const glibcLocalePattern = './glibc-install/share/i18n/locales/*';
const glibcCall = './currencies/currencies-libc';
const icuCall = './currencies/currencies-icu';

async function glibcLocales(): Promise<Array<string>> {
  return new Promise((resolve, reject) => {
    glob(glibcLocalePattern, (error, matches) => {
      error ? reject(error) : resolve(matches.map((match) => path.basename(match)));
    });
  });
}

async function gatherOutput(process: ChildProcessWithoutNullStreams): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = '';

    process.stdout.on('data', (data) => {
      output += data;
    });

    process.on('close', (code) => {
      (code !== 0) ? reject(code) : resolve(output);
    });

    process.on('error', reject);
  });
}

async function currenciesGlibc(): Promise<string> {
  const locales = await glibcLocales();

  return gatherOutput(spawn(glibcCall, locales));
}

async function currrenciesIcu(): Promise<string> {
  return gatherOutput(spawn(icuCall, []));
}

type EmptyRow<T> = [T];
type FormattedRow<T> = [T, T, T];
type Row<T> = EmptyRow<T> | FormattedRow<T>;
type Table<T> = Array<Row<T>>;

function outputToTable(output: string): Table<string> {
  // @ts-ignore we trust the structure of outputs
  return output.split('\u0018').filter(line => line !== '').map((line) => line.split('\u0019'));
}

type Formatting = { [amount: string]: string };
type LocaleFormattings = { [locale: string]: Formatting };
type EmptyLocales = Array<string>;
type FormattingsAndEmptys = [LocaleFormattings, EmptyLocales];

function tableToMapping(table: Table<string>): FormattingsAndEmptys {
  const [nonEmpty, empty] = partition(table, (row: Row<string>): row is FormattedRow<string> => row.length > 1);

  const emptyLocales = concat([], ...empty);
  // @ts-ignore - yeah the stuff below this isn't the cleanest
  const localeFormattings: LocaleFormattings = mapValues(
    groupBy(nonEmpty, ([locale]) => locale),
    (localeRows: Array<FormattedRow<string>>): Formatting => Object.assign(
      {},
      ...localeRows.map(([locale, amount, formatted]: FormattedRow<string>) => ({ [amount]: formatted })),
    ),
  );

  return [localeFormattings, emptyLocales];
}

type MergedLocale<T> = {
  locale: string;
  icu: T;
  glibc: T;
};
type PartialLocale = MergedLocale<Formatting | null>;
type CommonLocale = MergedLocale<Formatting>;

function isCommonLocale(locale: PartialLocale): locale is CommonLocale {
  return Boolean(locale.icu && locale.glibc);
}

type MergedMappings = {
  emptyLocales: {
    icu: Array<string>;
    glibc: Array<string>;
  };
  partialLocales: {
    icu: Array<PartialLocale>;
    glibc: Array<PartialLocale>;
  };
  commonLocales: Array<CommonLocale>;
};

function mergeMappings([icuRest, emptyIcuLocales]: FormattingsAndEmptys, [glibcRest, emptyGlibcLocales]: FormattingsAndEmptys): MergedMappings {
  const locales = uniq([
    ...Object.keys(icuRest),
    ...Object.keys(glibcRest),
  ]).map((key: string): PartialLocale => ({
    locale: key,
    icu: icuRest[key] || null,
    glibc: glibcRest[key] || null,
  }));

  const [commonLocales, partialLocales] = partition(locales, isCommonLocale);
  const [partialIcuLocales, partialGlibcLocales] = partition(partialLocales, ({ icu }) => !icu);

  return {
    emptyLocales: {
      icu: emptyIcuLocales || [],
      glibc: emptyGlibcLocales || [],
    },
    partialLocales: {
      icu: partialIcuLocales,
      glibc: partialGlibcLocales,
    },
    commonLocales,
  };
}

function partitionLocalesByComparison(
  locales: Array<CommonLocale>,
  compare: (icuAmount: string, icuFormatted: string, glibcAmount: string, glibcFormatted: string) => boolean,
): [Array<CommonLocale>, Array<CommonLocale>] {
  return partition(locales, ({ icu, glibc }: CommonLocale): boolean => {
    const pairs = zip(
      sortBy(Object.entries(icu), ([amount]) => amount),
      sortBy(Object.entries(glibc), ([amount]) => amount),
    );

    return every(pairs, ([[icuAmount, icuFormatted], [glibcAmount, glibcFormatted]]) => compare(icuAmount, icuFormatted, glibcAmount, glibcFormatted));
  });
}

function partitionEqualLocales(locales: Array<CommonLocale>): [Array<CommonLocale>, Array<CommonLocale>] {
  return partitionLocalesByComparison(
    locales,
    (icuKey, icuValue, glibcKey, glibcValue) => (icuKey === glibcKey && icuValue === glibcValue),
  );
}

(async () => {
  const icu = await currrenciesIcu();
  const glibc = await currenciesGlibc();

  const {
    commonLocales,
  } = mergeMappings(
    tableToMapping(outputToTable(icu)),
    tableToMapping(outputToTable(glibc)),
  );

  const [equalLocales, unequalLocales] = partitionEqualLocales(commonLocales);

  console.log(unequalLocales);
  console.log(Object.keys(unequalLocales).length);
})();