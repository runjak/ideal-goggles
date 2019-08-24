import glob from 'glob';
import path from 'path';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import groupBy from 'lodash/groupBy';

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

type BaseRow = { locale: string, amount: string };
type ComparisonRow<Comparison> = BaseRow & { icu: Comparison; glibc: Comparison };
type MaybeCurrencyRow = ComparisonRow<string | null | undefined>;
type CurrencyRow = ComparisonRow<string>;
type Table<Row> = Array<Row>;

function outputToTable(output: string, source: 'icu' | 'glibc'): Table<MaybeCurrencyRow> {
  const fields = output.split('\u0018').filter(line => line !== '').map((line) => line.split('\u0019'));

  return fields.map(([locale = '', amount = '', formatting]: Array<string>): MaybeCurrencyRow => ({
    locale,
    amount: amount,
    icu: null,
    glibc: null,
    [source]: formatting,
  }));
}

function mergeTables(t1: Table<MaybeCurrencyRow>, t2: Table<MaybeCurrencyRow>): Table<MaybeCurrencyRow> {
  const groupedTables = groupBy(
    [...t1, ...t2],
    ({ locale, amount }) => (`${locale}-${amount}`),
  );

  return Object.values(groupedTables).map(
    (tableGroup: Table<MaybeCurrencyRow>): MaybeCurrencyRow => tableGroup.reduce(
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
}

function isCurrencyRow(row: MaybeCurrencyRow): row is CurrencyRow {
  const { locale, amount, icu, glibc } = row;

  return Boolean(locale && amount && icu && glibc);
}

function filterEmptyRows(table: Table<MaybeCurrencyRow>): Table<MaybeCurrencyRow> {
  return table.filter(row => !isCurrencyRow(row));
}

function filterComparableRows(table: Table<MaybeCurrencyRow>): Table<CurrencyRow> {
  return table.filter(isCurrencyRow);
}

function filterEqualFormattings(table: Table<CurrencyRow>): Table<CurrencyRow> {
  return table.filter(({ icu, glibc }) => icu === glibc);
}

function stripWhitespace(s: string): string {
  return s.replace(/\s/g, '');
}

function filterEqualWhitespace(table: Table<CurrencyRow>): Table<CurrencyRow> {
  return table.filter(({ icu, glibc }) => stripWhitespace(icu) === stripWhitespace(glibc));
}

function filterDifferentWhitespace(table: Table<CurrencyRow>): Table<CurrencyRow> {
  return table.filter(({ icu, glibc }) => stripWhitespace(icu) !== stripWhitespace(glibc));
}

function sortChars(s: string): string {
  return Array.from(stripWhitespace(s)).sort().join('');
}

function filterSameChars(table: Table<CurrencyRow>): Table<CurrencyRow> {
  return table.filter(({ icu, glibc }) => sortChars(icu) === sortChars(glibc));
}

type TableFilter = (table: Table<MaybeCurrencyRow>) => Table<MaybeCurrencyRow>;

const filters: { [name: string]: TableFilter } = {
  empty: filterEmptyRows,
  comparable: filterComparableRows,
  equal: (table) => filterEqualFormattings(filterComparableRows(table)),
  whitespace: (table) => filterEqualWhitespace(filterComparableRows(table)),
  chars: (table) => filterSameChars(filterDifferentWhitespace(filterComparableRows(table))),
};

type Args = {
  filter: TableFilter | null;
  helpWanted: boolean;
  prettyPrint: boolean;
};

const defaultArgs: Args = {
  filter: null,
  helpWanted: false,
  prettyPrint: false,
};

const helpParameters = ['-h', '--help', '-help', 'help'];

function parseArgs(argv: Array<string>): Args {
  return argv.reduce(
    (args: Args, arg: string): Args => {
      if (Object.keys(filters).includes(arg)) {
        return {
          ...args,
          filter: filters[arg],
        };
      } else if (arg === 'prettyPrint') {
        return {
          ...args,
          prettyPrint: true,
        };
      } else if(helpParameters.includes(arg)) {
        return {
          ...args,
          helpWanted: true,
        };
      } else {
        return args;
      }
    },
    defaultArgs,
  );
}

function printHelp() {
  console.log([
    'ideal-goggles - https://github.com/runjak/ideal-goggles',
    '-------------------------------------------------------',
    '',
    'specify a filter with one of theses parameters:',
    Object.keys(filters).join(', '),
    '',
    'activate prettyPrint with the `prettyPrint` parameter.'
  ].join('\n'));
}

function printTable(table: Table<MaybeCurrencyRow>, prettyPrint: boolean) {
  if (prettyPrint) {
    console.table(table.slice(400));
  } else {
    console.log(JSON.stringify(table, undefined, 2));
  }
}

(async () => {
  const { filter, helpWanted, prettyPrint } = parseArgs(process.argv);

  if (helpWanted || !filter) {
    printHelp();
  } else {
    const icu = await currrenciesIcu();
    const glibc = await currenciesGlibc();

    const table = mergeTables(
      outputToTable(icu, 'icu'),
      outputToTable(glibc, 'glibc'),
    );

    const filteredTable = filter(table);

    printTable(filter(table), prettyPrint);
  }
})();