<!-- markdownlint-disable MD024 -->
# Change Log

All notable changes to the "chuck" extension will be documented in this file.

This document attempts to follow the structure described at [Keep a Changelog](http://keepachangelog.com/).

## [Unreleased]

## [0.2.2] - 2023-09-22

### Fixed

- Works on MS Windows
- Syntax message parsing updated to use chuck 1.5.x

## [0.2.1] - 2019-10-19

### Added

- Write output from ChucK subprocess to output window
- Add command to kill any running ChucK subprocesses, bound to `alt+escape` when in any
  ChucK editor window

### Changed

- Change keybinding to `alt+.` to avoid collision with Quick Fix

### Fixed

- Bugfix: Wait until active editor window is saved before playing
- Bugfix: Don't highlight indentation whitespace on line syntax error

## [0.2.0] - 2019-09-09

### Added

- Syntax checking. This uses ChucK's `--syntax` command-line switch, which has not
  yet made it into an official release version. You will need to build ChucK from
  the [Github source](https://github.com/ccrma/chuck) to use this. For that reason,
  this feature is disabled by default. The setting `chuck.extendErrorRegion` is provided
  to extend the marked error region backwards from what ChucK reports, making it more
  likely to include the actual error.

- Play Active Document command: Invoke ChucK to play the file in the currently-active
  text editor window. Bound by default to `ctrl+.` (Mnemonic is that key has `>` on it
  which looks like a play button, but we don't use shift to avoid keybinding collisions.)

## [0.0.1] - 2018-07-14

### Added

- Initial port of Courtney Wilburn's [Atom extension](https://github.com/cjwilburn/language-chuck) using
  [these simple instructions](https://www.reddit.com/r/vscode/comments/7qins6/porting_atom_packages_to_vscode/dsrdeqb/).
- Updated ChuGin list to match the contents of the [Github ChuGin repo](https://github.com/ccrma/chugins).
