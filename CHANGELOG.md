<!-- markdownlint-disable MD024 -->

# Change Log

All notable changes to the "chuck" extension will be documented in this file.

This document attempts to follow the structure described at [Keep a Changelog](http://keepachangelog.com/).

## [1.0.3] - 2025-10-03

- Change default keybindings from `alt` to `ctrl` (`cmd` on Mac) to avoid conflict with VSCode's `` alt+` ``
  keybinding (which now switches between open instances).

## [1.0.2] - 2025-08-29

- Fix syntax highlighting for single-quoted string. Report and fix by Ben Hoang, slightly tweaked by me.

## [1.0.1] - 2025-08-18

- Bugfix: syntax error highlighting was broken for Mac and Linux (thanks Nathan Leiby for alerting me to this
  issue and providing a fix for Mac).

## [1.0.0] - 2024-10-20

- Add hover text (ported from WebChuck IDE)

## [0.2.5] - 2023-10-15

- Add icon for ChucK files
- Bundle extension using esbuild

## [0.2.4] - 2023-10-14

- Kill all ChucK subprocesses now works correctly on MS Windows
- Kill all Chuck subprocesses keybinding changed from `alt+escape` to `` alt+` ``
  to avoid a keybinding collision with MS Windows

## [0.2.3] - 2023-09-23

- Bugfix: Save silently on play setting now saved correctly from dialog (thanks Clint Hoagland)

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
