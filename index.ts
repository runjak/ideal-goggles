import glob from 'glob';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import levenshtein from 'fast-levenshtein';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import partition from 'lodash/partition';
import uniq from 'lodash/uniq';

const glibcLocalePattern = './glibc-install/share/i18n/locales/*';
const glibcCall = './currencies/currencies-libc';
const icuCall = './currencies/currencies-icu';
const outputDirectory = './output/';
const outputPrefix = '2022-07-18';
const outputNames = {
  equal: 'equal',
  whitespace: 'whitespace',
  sameChars: 'same-chars',
  different: 'different',
  localeOverview: 'locale-overview',
};

function outputPath(name: string): string {
  const p = path.join(outputDirectory, `${outputPrefix}-${name}.md`);

  console.log(`Writing ${p}`);

  return p;
}

async function glibcLocales(): Promise<Array<string>> {
  return new Promise((resolve, reject) => {
    glob(glibcLocalePattern, (error, matches) => {
      error
        ? reject(error)
        : resolve(matches.map(match => path.basename(match)));
    });
  });
}

async function gatherOutput(
  process: ChildProcessWithoutNullStreams,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = '';

    process.stdout.on('data', data => {
      output += data;
    });

    process.on('close', code => {
      code !== 0 ? reject(code) : resolve(output);
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

type BaseRow = { locale: string; amount: string };
type ComparisonRow<Comparison> = BaseRow & {
  icu: Comparison;
  glibc: Comparison;
};
type MaybeCurrencyRow = ComparisonRow<string | null | undefined>;
type CurrencyRow = ComparisonRow<string>;
type Table<Row> = Array<Row>;

function outputToTable(
  output: string,
  source: 'icu' | 'glibc',
): Table<MaybeCurrencyRow> {
  const fields = output
    .split('\u0018')
    .filter(line => line !== '')
    .map(line => line.split('\u0019'));

  return fields.map(
    ([locale = '', amount = '', formatting]: Array<
      string
    >): MaybeCurrencyRow => ({
      locale,
      amount: amount,
      icu: null,
      glibc: null,
      [source]: formatting,
    }),
  );
}

function sortTable(table: Table<MaybeCurrencyRow>): Table<MaybeCurrencyRow> {
  return sortBy(table, ({ locale, icu, glibc }: MaybeCurrencyRow): [
    string,
    number,
  ] => {
    if (!icu || !glibc) {
      return [locale, Number.POSITIVE_INFINITY];
    }

    return [locale, levenshtein.get(icu, glibc)];
  });
}

function mergeTables(
  t1: Table<MaybeCurrencyRow>,
  t2: Table<MaybeCurrencyRow>,
): Table<MaybeCurrencyRow> {
  const groupedTables = groupBy(
    [...t1, ...t2],
    ({ locale, amount }) => `${locale}-${amount}`,
  );

  const table = Object.values(groupedTables).map(
    (tableGroup: Table<MaybeCurrencyRow>): MaybeCurrencyRow =>
      tableGroup.reduce(
        (
          { icu: currentIcu, glibc: currentGlibc }: MaybeCurrencyRow,
          { locale, amount, icu, glibc }: MaybeCurrencyRow,
        ): MaybeCurrencyRow => ({
          locale,
          amount,
          icu: icu || currentIcu,
          glibc: glibc || currentGlibc,
        }),
        { locale: '', amount: '', icu: null, glibc: null },
      ),
  );

  return sortTable(table);
}

function isCurrencyRow(row: MaybeCurrencyRow): row is CurrencyRow {
  const { locale, amount, icu, glibc } = row;

  return Boolean(locale && amount && icu && glibc);
}

function filterComparableRows(
  table: Table<MaybeCurrencyRow>,
): Table<CurrencyRow> {
  return table.filter(isCurrencyRow);
}

function partitionEqualFormattings(
  table: Table<CurrencyRow>,
): [Table<CurrencyRow>, Table<CurrencyRow>] {
  return partition(table, ({ icu, glibc }) => icu === glibc);
}

function stripWhitespace(s: string): string {
  return s.replace(/\s/g, '');
}

function partitionEqualWhitespace(
  table: Table<CurrencyRow>,
): [Table<CurrencyRow>, Table<CurrencyRow>] {
  return partition(
    table,
    ({ icu, glibc }) => stripWhitespace(icu) === stripWhitespace(glibc),
  );
}

function sortChars(s: string): string {
  return Array.from(stripWhitespace(s))
    .sort()
    .join('');
}

function partitionSameChars(
  table: Table<CurrencyRow>,
): [Table<CurrencyRow>, Table<CurrencyRow>] {
  return partition(
    table,
    ({ icu, glibc }) => sortChars(icu) === sortChars(glibc),
  );
}

async function comparisonTable(): Promise<Table<CurrencyRow>> {
  const icu = await currrenciesIcu();
  const glibc = await currenciesGlibc();

  const table = mergeTables(
    outputToTable(icu, 'icu'),
    outputToTable(glibc, 'glibc'),
  );

  return filterComparableRows(table);
}

function markdownTable(table: Table<CurrencyRow>): string {
  return [
    'index | locale | amount | icu | glibc',
    '----- | ------ | ------ | --- | -----',
    ...table.map(
      ({ locale, amount, icu, glibc }: CurrencyRow, index: number): string =>
        `${index} | [${locale}](${outputPrefix}-${locale}) | \`${amount}\` | \`${icu}\` | \`${glibc}\``,
    ),
    '',
  ].join('\n');
}

function markdownHeadline(headline: string): string {
  return [headline, '===', ''].join('\n');
}

function localesFromTable(table: Table<CurrencyRow>): Array<string> {
  return uniq(table.map(({ locale }) => locale));
}

function checkmark(good: boolean): string {
  return good ? ':heavy_check_mark:' : ':x:';
}

function markdownCompatibilityTable(
  locales: Array<string>,
  equalFormattingLocales: Array<string>,
  equalWhitespaceLocales: Array<string>,
  sameCharLocales: Array<string>,
  differentCharLocales: Array<string>,
): string {
  return [
    [
      'locale',
      `[equal formatting](${outputPrefix}-${outputNames.equal})`,
      `[equal whitespace](${outputPrefix}-${outputNames.whitespace})`,
      `[same chars](${outputPrefix}-${outputNames.sameChars})`,
      `[different chars](${outputPrefix}-${outputNames.different})`,
    ].join(' | '),
    '------ | ---------------- | ---------------- | ---------- | ---------------',
    ...locales.map(locale => {
      const equal = checkmark(equalFormattingLocales.includes(locale));
      const whitespace = checkmark(equalWhitespaceLocales.includes(locale));
      const sameChars = checkmark(sameCharLocales.includes(locale));
      const different = checkmark(differentCharLocales.includes(locale));

      return `[${locale}](${outputPrefix}-${locale}) | ${equal} | ${whitespace} | ${sameChars} | ${different}`;
    }),
  ].join('\n');
}

function generateLocaleOverview(
  locales: Array<string>,
  equalFormattingLocales: Array<string>,
  equalWhitespaceLocales: Array<string>,
  sameCharLocales: Array<string>,
  differentCharLocales: Array<string>,
): void {
  fs.writeFileSync(
    outputPath(outputNames.localeOverview),
    markdownCompatibilityTable(
      locales,
      equalFormattingLocales,
      equalWhitespaceLocales,
      sameCharLocales,
      differentCharLocales,
    ),
  );
}

function createGenerateLocaleReport(
  table: Table<CurrencyRow>,
  equalFormattingLocales: Array<string>,
  equalWhitespaceLocales: Array<string>,
  sameCharLocales: Array<string>,
  differentCharLocales: Array<string>,
) {
  return (locale: string): void => {
    fs.writeFileSync(
      outputPath(locale),
      [
        markdownHeadline(`Locale ${locale}:`),
        markdownTable(table.filter(row => row.locale === locale)),
        markdownCompatibilityTable(
          [locale],
          equalFormattingLocales,
          equalWhitespaceLocales,
          sameCharLocales,
          differentCharLocales,
        ),
      ].join('\n'),
    );
  };
}

(async () => {
  const table = await comparisonTable();

  const [equalFormattings, differentFormattings] = partitionEqualFormattings(
    table,
  );
  const [equalWhitespace, differentWhitespace] = partitionEqualWhitespace(
    differentFormattings,
  );
  const [sameChars, differentChars] = partitionSameChars(differentWhitespace);

  const comparisonTables = [
    {
      headline: 'Equal entries:',
      table: equalFormattings,
      name: outputNames.equal,
    },
    {
      headline: 'Equal without whitespace:',
      table: equalWhitespace,
      name: outputNames.whitespace,
    },
    {
      headline: 'Same chars used:',
      table: sameChars,
      name: outputNames.sameChars,
    },
    {
      headline: 'Completely different entries:',
      table: differentChars,
      name: outputNames.different,
    },
  ];

  comparisonTables.forEach(({ headline, table, name }) => {
    fs.writeFileSync(
      outputPath(name),
      `${markdownHeadline(headline)}\n${markdownTable(table)}`,
    );
  });

  const locales = localesFromTable(table);
  const equalFormattingLocales = localesFromTable(equalFormattings);
  const equalWhitespaceLocales = localesFromTable(equalWhitespace);
  const sameCharLocales = localesFromTable(sameChars);
  const differentCharLocales = localesFromTable(differentChars);

  generateLocaleOverview(
    locales,
    equalFormattingLocales,
    equalWhitespaceLocales,
    sameCharLocales,
    differentCharLocales,
  );

  const generateLocaleReport = createGenerateLocaleReport(
    table,
    equalFormattingLocales,
    equalWhitespaceLocales,
    sameCharLocales,
    differentCharLocales,
  );
  locales.forEach(generateLocaleReport);
})();
