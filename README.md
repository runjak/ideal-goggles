ideal-goggles 🥽✨
===

This project is concerned with the way currencies are formatted for different locales in two major projects:

* [icu](https://github.com/unicode-org/icu)
* [glibc](https://www.gnu.org/software/libc/libc.html)

Project structure
---

* The projects to compare, `icu` and `glibc` will be cloned into subdirectories, and be built and installed in the project directory.
* Two separate binaries are built, one per project, to output the formatted currencies per locale. These binaries are kept in the `currencies` directory.
* Execution of `index.ts` will lead to:
  * Executing the two binaries to gather and compare their output.
  * The filter used for comparison will be selected from cli arguments.

Project setup
---

The project makes use [Node.js](https://nodejs.org), [yarn](https://yarnpkg.com) and several tools to compile C/C++ code as well as popular linux cli programs.

There are some helper scripts to aid with installing or updating dependencies:

* Use `clone-repos.sh` to initially clone the glibc and icu repositories.
  * These repositories will be cloned into the `glibc` and `icu` directories respectively.
  * Later on it may be desireable to checkout specific versions of each project - which can be done using `git`.
* Use `yarn build` as a handy way to execute the different build scripts for different steps in the project.
* Make sure to execute `yarn install` for the node dependencies.
* Use `yarn start` along with additional arguments specified in the help/default output to compare the currency formattings across locales in `glibc` and `icu`.

Filters and output
---

Table rows are sorted by ascending levensthein distance of the formattings. Partial or missing entries are weigthed as `Number.POSITIVE_INFINITY` to make sure they end up in a prominent position if not filtered out.

| Filter           | Description |
| ---------------- | ----------- |
| `all`            | directly outputs all table entries gathered from the binaries in the `currencies` directory. |
| `empty`          | outputs only entries where at least one of the formattings is missing or empty. |
| `comparable`     | outputs entries where a formatting is available in both, `icu` and `glibc`. |
| `equal`          | outputs entries where the formattings between `icu` and `glibc` are equal strings. |
| `whitespace`     | outputs entries where the formattings are the same after stripping all whitespace characters from the strings. Does not include entries already found by the `equal` filter. |
| `sameChars`      | outputs entries that use the same characters in their formatted strings but that are not included in `whitespace` filter. |
| `differentChars` | outputs entries where the formatting does not match ignoring whitespace and where different characters are used. |
