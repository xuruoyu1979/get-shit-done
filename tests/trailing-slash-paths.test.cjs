/**
 * GSD Tools Tests - Trailing Slash in Runtime Path Replacements
 *
 * Verifies that CLAUDE.md -> .cursor/rules and .windsurf/rules replacements
 * in install.js do not produce paths with trailing slashes.
 *
 * Node.js v25 preserves trailing slashes in path.join, causing writeFileSync
 * to fail with ENOENT when the generated path ends in '/'.
 *
 * Regression test for: https://github.com/gsd-build/get-shit-done/issues/1392
 */

process.env.GSD_TEST_MODE = '1';

const { test, describe } = require('node:test');
const assert = require('node:assert');

const {
  convertClaudeToWindsurfMarkdown,
} = require('../bin/install.js');

describe('trailing slash in runtime path replacements (#1392)', () => {

  test('convertClaudeToWindsurfMarkdown does not produce paths ending in /', () => {
    // Simulate the kind of source code that profile-output.cjs contains
    const input = "outputPath = path.join(cwd, 'CLAUDE.md');";
    const result = convertClaudeToWindsurfMarkdown(input);

    // The replacement must not leave a trailing slash in the path string
    assert.ok(
      !result.includes("'.windsurf/rules/'"),
      `Expected no trailing slash in path literal, got: ${result}`
    );
    // It should contain the path without trailing slash
    assert.ok(
      result.includes('.windsurf/rules'),
      `Expected .windsurf/rules in result, got: ${result}`
    );
  });

  test('Windsurf markdown conversion replaces CLAUDE.md references without trailing slash in code context', () => {
    // This simulates what happens when install.js processes JS source files
    // containing path.join(cwd, 'CLAUDE.md') at lines like 851 of profile-output.cjs
    const jsSource = [
      "const targetPath = path.join(cwd, 'CLAUDE.md');",
      "outputPath = path.join(os.homedir(), '.claude', 'CLAUDE.md');",
      "fs.writeFileSync(path.join(dir, 'CLAUDE.md'), content);",
    ].join('\n');

    const result = convertClaudeToWindsurfMarkdown(jsSource);

    // No path literal should end with a trailing slash
    const pathLiterals = result.match(/'[^']*\.windsurf\/rules[^']*'/g) || [];
    for (const literal of pathLiterals) {
      assert.ok(
        !literal.endsWith("/'"),
        `Path literal has trailing slash: ${literal}`
      );
    }
  });

  test('JS source code regex replacement for Cursor does not produce trailing slash', () => {
    // Directly test the regex that install.js uses at line 3042 for Cursor
    // This is the same pattern used in the copyDir function
    const jsSource = "outputPath = path.join(cwd, 'CLAUDE.md');";

    // Read the current replacement pattern from install.js
    const fs = require('fs');
    const path = require('path');
    const installSource = fs.readFileSync(
      path.join(__dirname, '..', 'bin', 'install.js'),
      'utf8'
    );

    // Extract the Cursor JS replacement lines (around line 3042)
    // jsContent = jsContent.replace(/CLAUDE\.md/g, '.cursor/rules/');
    const cursorMatch = installSource.match(
      /jsContent\.replace\(\/CLAUDE\\\.md\/g,\s*'([^']*)'\)/
    );
    assert.ok(cursorMatch, 'Could not find Cursor CLAUDE.md replacement in install.js');

    const cursorReplacement = cursorMatch[1];
    assert.ok(
      !cursorReplacement.endsWith('/'),
      `Cursor replacement string has trailing slash: '${cursorReplacement}'`
    );
  });

  test('JS source code regex replacement for Windsurf does not produce trailing slash', () => {
    const fs = require('fs');
    const path = require('path');
    const installSource = fs.readFileSync(
      path.join(__dirname, '..', 'bin', 'install.js'),
      'utf8'
    );

    // There are multiple .windsurf/rules replacements; find the one in the JS transform section
    // which is: jsContent = jsContent.replace(/CLAUDE\.md/g, '.windsurf/rules/');
    const allMatches = [...installSource.matchAll(
      /jsContent\s*=\s*jsContent\.replace\(\/CLAUDE\\\.md\/g,\s*'([^']*)'\)/g
    )];
    assert.ok(allMatches.length > 0, 'Could not find any CLAUDE.md JS replacements in install.js');

    for (const match of allMatches) {
      const replacement = match[1];
      assert.ok(
        !replacement.endsWith('/'),
        `JS source replacement string has trailing slash: '${replacement}'`
      );
    }
  });

  test('Markdown content conversion replacements do not produce trailing slashes', () => {
    const fs = require('fs');
    const path = require('path');
    const installSource = fs.readFileSync(
      path.join(__dirname, '..', 'bin', 'install.js'),
      'utf8'
    );

    // Find all .cursor/rules/ and .windsurf/rules/ replacement strings
    const allReplacements = [...installSource.matchAll(
      /\.replace\([^,]+,\s*'(\.[^']*rules\/?)'\)/g
    )];

    for (const match of allReplacements) {
      const replacement = match[1];
      assert.ok(
        !replacement.endsWith('/'),
        `Content replacement string has trailing slash: '${replacement}'`
      );
    }
  });
});
