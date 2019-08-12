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
* Generate the `glibc` locales using `build-glibc-locales.sh`.
  * This generates the glibc locale definitions that are often installed systemwide. For the sake of this project they are generated locally and corresponding to the currently checked out version of `glibc`.
  * Afterwards we can compile `glibc` to use these generated locales so that we can test different `glibc` versions independently of the systems locales and `glibc`.
* Build both, `icu` and `glibc` using `build-dependencies.sh`.

Project source
---

* Project source code is kept in `src/`.
* Code can be compiled using `build.sh` and will produce a binary named `ideal-goggles`.
* Code can be built and executed using `run.sh` to ease the compile + experiment loop.
