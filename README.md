# ideal-goggles 🥽✨

This project is concerned with the way currencies are formatted for different locales in two major projects:

- [icu](https://github.com/unicode-org/icu)
- [glibc](https://www.gnu.org/software/libc/libc.html)

## Project structure

- The projects to compare, `icu` and `glibc` will be cloned into subdirectories, and be built and installed in the project directory.
- Two separate binaries are built, one per project, to output the formatted currencies per locale. These binaries are kept in the `currencies` directory.
- Execution of `index.ts` will lead to:
  - Executing the two binaries to gather and compare their output.
  - Generation of several markdown files as a report in the `output` directory.

## Project setup

The project makes use [Node.js](https://nodejs.org), [yarn](https://yarnpkg.com) and several tools to compile C/C++ code as well as popular linux cli programs.

There are some helper scripts to aid with installing or updating dependencies:

- Use `clone-repos.sh` to initially clone the glibc and icu repositories.
  - These repositories will be cloned into the `glibc` and `icu` directories respectively.
  - Later on it may be desireable to checkout specific versions of each project - which can be done using `git`.
- Use `yarn build` as a handy way to execute the different build scripts for different steps in the project.
- Make sure to execute `yarn install` for the node dependencies.
- Use `yarn start` to produce a report as several markdown files in the `output` directory.
