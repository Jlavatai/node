// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';
const common = require('../common');
const assert = require('assert');
const {join} = require('path');
const {execFile} = require('child_process');

// test for leaked global detection
global.gc = 42;  // Not a valid global unless --expose_gc is set.
assert.deepStrictEqual(common.leakedGlobals(), ['gc']);
delete global.gc;


// common.mustCall() tests
assert.throws(function() {
  common.mustCall(function() {}, 'foo');
}, /^TypeError: Invalid exact value: foo$/);

assert.throws(function() {
  common.mustCall(function() {}, /foo/);
}, /^TypeError: Invalid exact value: \/foo\/$/);

assert.throws(function() {
  common.mustCallAtLeast(function() {}, /foo/);
}, /^TypeError: Invalid minimum value: \/foo\/$/);

// assert.fail() tests
assert.throws(
  () => { assert.fail('fhqwhgads'); },
  common.expectsError({
    code: 'ERR_ASSERTION',
    message: /^fhqwhgads$/
  }));

const fnOnce = common.mustCall(() => {});
fnOnce();
const fnTwice = common.mustCall(() => {}, 2);
fnTwice();
fnTwice();
const fnAtLeast1Called1 = common.mustCallAtLeast(() => {}, 1);
fnAtLeast1Called1();
const fnAtLeast1Called2 = common.mustCallAtLeast(() => {}, 1);
fnAtLeast1Called2();
fnAtLeast1Called2();
const fnAtLeast2Called2 = common.mustCallAtLeast(() => {}, 2);
fnAtLeast2Called2();
fnAtLeast2Called2();
const fnAtLeast2Called3 = common.mustCallAtLeast(() => {}, 2);
fnAtLeast2Called3();
fnAtLeast2Called3();
fnAtLeast2Called3();

const failFixtures = [
  [
    join(common.fixturesDir, 'failmustcall1.js'),
    'Mismatched <anonymous> function calls. Expected exactly 2, actual 1.'
  ], [
    join(common.fixturesDir, 'failmustcall2.js'),
    'Mismatched <anonymous> function calls. Expected at least 2, actual 1.'
  ]
];
for (const p of failFixtures) {
  const [file, expected] = p;
  execFile(process.argv[0], [file], common.mustCall((ex, stdout, stderr) => {
    assert.ok(ex);
    assert.strictEqual(stderr, '');
    const firstLine = stdout.split('\n').shift();
    assert.strictEqual(firstLine, expected);
  }));
}
