const glob = require('glob');
const path = require('path');
const { spawn } = require('child_process');
const groupBy = require('lodash/groupBy');
const mapValues = require('lodash/mapValues');
const uniq = require('lodash/uniq');
const partition = require('lodash/partition');
const zip = require('lodash/zip');
const every = require('lodash/every');
const sortBy = require('lodash/sortBy');
const pick = require('lodash/pick');

const glibcLocalePattern = './glibc-install/share/i18n/locales/*';
const glibcCall = './currencies/currencies-libc';
const icuCall = './currencies/currencies-icu';

async function glibcLocales() {
  return new Promise((resolve, reject) => {
    glob(glibcLocalePattern, (error, matches) => {
      error ? reject(error) : resolve(matches.map((match) => path.basename(match)));
    });
  });
}

async function gatherOutput(process) {
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

async function currenciesGlibc() {
  const locales = await glibcLocales();

  return gatherOutput(spawn(glibcCall, locales));
}

async function currrenciesIcu() {
  return gatherOutput(spawn(icuCall, []));
}

function outputToTable(output) {
  return output.split('\30').filter(line => line !== '').map((line) => line.split('\31'));
}

function tableToMapping(table) {
  return mapValues(
    groupBy(table, (row) => row.length > 1 ? row[0] : 'empty'),
    (locales, key) => {
      if (key === 'empty') {
        return locales.map(([locale]) => locale)
      }

      return Object.assign({},
        ...locales.map(([locale, amount, formatted]) => ({ [amount]: formatted })),
      );
    },
  );
}

function mergeMappings(icuMapping, glibcMapping) {
  const { empty: emptyIcuLocales, ...icuRest } = icuMapping;
  const { empty: emptyGlibcLocales, ...glibcRest } = glibcMapping;

  const locales = uniq([
    ...Object.keys(icuRest),
    ...Object.keys(glibcRest),
  ]).map((key) => ({
    locale: key,
    icu: icuRest[key] || null,
    glibc: glibcRest[key] || null,
  }));

  const [partialLocales, commonLocales] = partition(locales, ({ icu, glibc }) => !icu || !glibc);
  const [missingIcuLocales, missingGlibcLocales] = partition(partialLocales, ({ icu }) => !icu);

  return {
    emptyLocales: {
      icu: emptyIcuLocales || [],
      glibc: emptyGlibcLocales || [],
    },
    missingIcuLocales,
    missingGlibcLocales,
    commonLocales,
  };
}

function partitionLocalesBy(locales, predicate) {
  const [equalKeys, unequalKeys] = partition(Object.keys(locales), (key) => {
    const { icu, glibc } = locales[key];

    return every(
      zip(
        sortBy(Object.entries(icu), ([key]) => key),
        sortBy(Object.entries(glibc), ([key]) => key),
      ),
      predicate,
    );
  });

  return [
    pick(locales, equalKeys),
    pick(locales, unequalKeys),
  ];
}

function partitionEqualLocales(locales) {
  return partitionLocalesBy(
    locales,
    ([[icuKey, icuValue], [glibcKey, glibcValue]]) => (icuKey === glibcKey && icuValue === glibcValue),
  );
}

(async () => {
  const icu = await currrenciesIcu();
  const glibc = await currenciesGlibc();

  const {
    emptyLocales,
    missingIcuLocales,
    missingGlibcLocales,
    commonLocales,
  } = mergeMappings(
    tableToMapping(outputToTable(icu)),
    tableToMapping(outputToTable(glibc)),
  );

  const [equalLocales, unequalLocales] = partitionEqualLocales(commonLocales);

  console.log(unequalLocales);
  console.log(Object.keys(unequalLocales).length);
})();