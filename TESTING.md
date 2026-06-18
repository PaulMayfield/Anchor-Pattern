# Testing & Validation Guide

Before deploying changes to the JavaScript implementation, verify functionality against the Python original.

## Quick Validation Methods

### Option 1: Browser Test Suite (Easiest)
Open `test.html` in your browser to run all unit tests in real-time.
- All core game logic functions are tested
- Shows pass/fail for each test case
- ✅ If all tests pass, you're safe to deploy

### Option 2: Node.js Test Runner (If Node.js installed)
```bash
node test.js
```
This runs the full test suite and outputs results to console.

### Option 3: Python Test Suite
```bash
python test_validation.py
```
This validates the JavaScript implementation by comparing outputs against the original Python code.

---

## What Gets Tested

✅ **mod6ToDie** - Die value wrapping (0 → 6)
✅ **computeCorrectValue** - Math calculations (sum, difference, product)
✅ **classifyFeedback** - Feedback classification (both/roll_only/guess_only/neither)
✅ **advanceHypothesis** - Hypothesis advancement and phase/c value updates
✅ **initialHypotheses** - Hypothesis generation (should be 10 total)
✅ **filterHypotheses** - Filtering hypotheses based on feedback
✅ **chooseAutoplayGuess** - AI guess selection logic
✅ **getPermutations** - Permutation generation

---

## Important: Test Before Deploying

1. Make your changes to `game.js`
2. Open `test.html` or run `node test.js`
3. **Verify all tests pass** before committing
4. If tests fail, fix the game logic until all tests pass
5. Then commit and push to GitHub

This prevents bugs from reaching testers!

---

## Example: Testing a Change

Say you modify the `computeCorrectValue` function:

```javascript
// Before deploying, check test.html
// You should see: ✓ sum(1, 2, 3) = 6
// If you see: ✗ sum(1, 2, 3) = 6, your change broke something
```

The tests are a safety net to catch regressions.
