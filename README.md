<!-- markdownlint-disable MD033 -->

# vscode-chuck

This extension is for the [ChucK music programming language](http://chuck.stanford.edu/). It implements:

- Syntax highlighting
- Syntax checking
- Hover text contextual documentation
- A command to play the ChucK file in the active editor window, and a command to
  kill any Chuck process started this way.

The syntax checking feature relies on ChucK's `--syntax` command-line switch, which has been
in the official release since at least 1.5.x. The syntax checking does not know about objects
defined in other files that are intended to be available at runtime using `Machine.add()`,
so multi-file projects will contain suprious errors. For this reason, syntax checking is
turned off by default. Any suggestions for handling multi-file project syntax checking would
be most welcome; code fixes doubly so.

The syntax checker reports errors at the location given by ChucK's error messages. These
can be a bit off; the actual error may be just before the marked section; look backwards
as far as the previous statement or block end (`;` or `}`) to find it. They are also often
one character wide; keep your eye out for tiny red squiggles.

The boolean configuration setting `chuck.extendErrorRegion` will extend the marked error region
backwards from what ChucK reports to the first non-whitespace character past the previous block
or statement end. This is kind of a hack: despite the fact that VSCode has parsed the syntax to
colorize the code, I do not have programmatic access to that info. So I look backwards for the
first `;` or `}` I find, but don't check whether that's within a comment. This means the error
squiggle my go back to somewhere in a comment instead of all the way back to the previous block
or statment end. I figure this will be rare, and the results will still be useful as long as
you're aware of this quirk. Turning this setting on should make error regions much more visible
and much more likely to include the actual error.

Even so, `chuck.extendErrorRegion` is turned off by default.

The command to play the currently active ChucK file is bound by default to the `alt+.` key combo.
(Mnemonic is that key has `>` on it which looks like a play button, but we don't use shift to
avoid keybinding collisions.) When you invoke this command on an unsaved ChucK editor window,
you will be prompted to save, with the option to always save silently before playing from then on.
Any output is written to the output window.

Multiple ChucK processes playing the same or different files can be invoked at once.
This is supposed to be a feature, not a bug. To kill all running ChucK processes started
this way, press `` alt+` `` when in any ChucK text editor window. (This used to be `alt+escape`
but it was moved to avoid a keybinding collision in Windows.)

Here is a table of the configuration settings provided by this extension. Most users should
be able to configure everything in VSCode's settings dialog, but they are provided here for
completeness.

| setting                    | default                         | description                                                                                                                               |
| -------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `chuck.executable`         | `"chuck"`                       | The chuck executable                                                                                                                      |
| `chuck.enableSyntaxCheck`  | `false`                         | Boolean to enable syntax check.                                                                                                           |
| `chuck.syntaxCheckArgs`    | `[ "--color:off", "--syntax" ]` | Arguments to chuck when used for syntax checking.<br />An array of strings, each element an argument including the leading dash.          |
| `chuck.extendErrorRegion`  | `false`                         | Boolean to extend the highlighted error region backwards from what chuck reports<br /> to just past the previous statement end.           |
| `chuck.playArgs`           | `[]`                            | Arguments to chuck when used for playing the current file.<br />An array of strings, each element an argument including the leading dash. |
| `chuck.saveSilentlyOnPlay` | `false`                         | Save without prompting before playing the current file.                                                                                   |

Syntax highlighting was initially ported from Courtney Wilburn's [Atom extension](https://github.com/cjwilburn/language-chuck).
