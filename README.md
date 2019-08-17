ideal-goggles
===

This project is concerned with the way numbers are formatted for different locales in two major projects:

* [icu](https://github.com/unicode-org/icu)
* [glibc](https://www.gnu.org/software/libc/libc.html)

Setup dependencies
---

There are some helper scripts to aid with installing or updating dependencies:

* Use `clone-repos.sh` to initially clone the glibc and icu repositories.
  * These repositories will be cloned into the `glibc` and `icu` directories respectively.
  * Later on it may be desireable to checkout specific versions of each project - which can be done using `git`.
* Execute `build-dependencies.sh`. It builds `glibc` and `icu`, and aftwards generates the `glibc` locales.

Project source
---

* Project source code is kept in `src/`.
* Code can be compiled using `build.sh` and will produce a binary named `ideal-goggles`.
* Code can be built and executed using `run.sh` to ease the compile + experiment loop.
