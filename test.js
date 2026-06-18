// Test suite for Anchor Pattern game - Run with: node test.js

// Simple test framework
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✓ ${message}`);
        passCount++;
    } else {
        console.error(`✗ ${message}`);
        failCount++;
    }
}

function assertEquals(actual, expected, message) {
    const pass = actual === expected;
    assert(pass, `${message} (expected: ${expected}, got: ${actual})`);
}

function deepEquals(obj1, obj2, message) {
    const pass = JSON.stringify(obj1) === JSON.stringify(obj2);
    assert(pass, `${message}`);
}

// Load game logic
// Copy the game functions here for testing
const PHASES = ["sum", "difference"];

class Hypothesis {
    constructor(rotation, offset, phaseIndex = 0, c = 0) {
        this.rotation = rotation;
        this.offset = offset;
        this.phaseIndex = phaseIndex;
        this.c = c;
    }
}

function mod6ToDie(value) {
    const result = value % 6;
    return result === 0 ? 6 : result;
}

function computeCorrectValue(phase, a, b, c) {
    if (phase === "sum") {
        return mod6ToDie(a + b + c);
    }
    if (phase === "difference") {
        return mod6ToDie(a - b + c);
    }
    if (phase === "product") {
        return mod6ToDie(a * b + c);
    }
    throw new Error(`Unknown phase: ${phase}`);
}

function classifyFeedback(correctValue, guess, roll) {
    const guessCorrect = guess === correctValue;
    const rollCorrect = roll === correctValue;
    if (guessCorrect && rollCorrect) return "both";
    if (rollCorrect) return "roll_only";
    if (guessCorrect) return "guess_only";
    return "neither";
}

function advanceHypothesis(hypothesis, exitedPhase) {
    if (!exitedPhase) return hypothesis;
    const nextPhaseIndex = (hypothesis.phaseIndex + 1) % hypothesis.rotation.length;
    const nextC = (hypothesis.c + hypothesis.offset) % 6;
    return new Hypothesis(hypothesis.rotation, hypothesis.offset, nextPhaseIndex, nextC);
}

function getPermutations(arr) {
    if (arr.length <= 1) return [arr];
    const perms = [];
    for (let i = 0; i < arr.length; i++) {
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
        const subPerms = getPermutations(rest);
        for (const perm of subPerms) {
            perms.push([arr[i], ...perm]);
        }
    }
    return perms;
}

function initialHypotheses() {
    const hypotheses = [];
    const rotations = getPermutations(PHASES);
    for (const rotation of rotations) {
        for (let offset = 1; offset <= 5; offset++) {
            hypotheses.push(new Hypothesis(rotation, offset));
        }
    }
    return hypotheses;
}

function filterHypotheses(hypotheses, a, b, guess, roll, observedFeedback) {
    const kept = [];
    for (const hypothesis of hypotheses) {
        const phase = hypothesis.rotation[hypothesis.phaseIndex];
        const correctValue = computeCorrectValue(phase, a, b, hypothesis.c);
        const predictedFeedback = classifyFeedback(correctValue, guess, roll);
        if (predictedFeedback === observedFeedback) {
            kept.push(advanceHypothesis(hypothesis, predictedFeedback === "both"));
        }
    }
    return kept;
}

function chooseAutoplayGuess(hypotheses, a, b) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const hypothesis of hypotheses) {
        const phase = hypothesis.rotation[hypothesis.phaseIndex];
        const correctValue = computeCorrectValue(phase, a, b, hypothesis.c);
        counts[correctValue]++;
    }
    const bestCount = Math.max(...Object.values(counts));
    const bestValues = Object.keys(counts)
        .filter(value => counts[value] === bestCount)
        .map(Number);
    return bestValues[Math.floor(Math.random() * bestValues.length)];
}

// ============ TESTS ============

console.log("\n🧪 Testing Anchor Pattern Game Logic\n");

console.log("=== mod6ToDie Function ===");
assertEquals(mod6ToDie(0), 6, 'mod6ToDie(0) should return 6');
assertEquals(mod6ToDie(1), 1, 'mod6ToDie(1) should return 1');
assertEquals(mod6ToDie(6), 6, 'mod6ToDie(6) should return 6');
assertEquals(mod6ToDie(7), 1, 'mod6ToDie(7) should return 1');
assertEquals(mod6ToDie(13), 1, 'mod6ToDie(13) should return 1');
assertEquals(mod6ToDie(-1), 5, 'mod6ToDie(-1) should return 5');
assertEquals(mod6ToDie(-6), 6, 'mod6ToDie(-6) should return 6');

console.log("\n=== computeCorrectValue Function ===");
assertEquals(computeCorrectValue("sum", 1, 2, 3), 6, 'sum(1, 2, 3) = 6');
assertEquals(computeCorrectValue("sum", 2, 2, 2), 6, 'sum(2, 2, 2) = 6');
assertEquals(computeCorrectValue("sum", 1, 1, 1), 3, 'sum(1, 1, 1) = 3');
assertEquals(computeCorrectValue("difference", 5, 2, 1), 4, 'diff(5, 2, 1) = 4');
assertEquals(computeCorrectValue("difference", 3, 3, 3), 3, 'diff(3, 3, 3) = 3');
assertEquals(computeCorrectValue("difference", 1, 5, 0), 2, 'diff(1, 5, 0) = 2 (1-5+0=-4, -4%6=2)');
assertEquals(computeCorrectValue("product", 2, 3, 1), 1, 'prod(2, 3, 1) = 1 (2*3+1=7, 7%6=1)');

console.log("\n=== classifyFeedback Function ===");
assertEquals(classifyFeedback(3, 3, 3), "both", 'guess and roll both correct');
assertEquals(classifyFeedback(3, 3, 4), "guess_only", 'only guess correct');
assertEquals(classifyFeedback(3, 4, 3), "roll_only", 'only roll correct');
assertEquals(classifyFeedback(3, 4, 5), "neither", 'neither correct');

console.log("\n=== advanceHypothesis Function ===");
const hyp1 = new Hypothesis(["sum", "difference"], 2, 0, 1);
const advanced1 = advanceHypothesis(hyp1, true);
assertEquals(advanced1.phaseIndex, 1, 'phaseIndex advances to 1');
assertEquals(advanced1.c, 3, 'c advances to (1 + 2) % 6 = 3');

const hyp2 = new Hypothesis(["sum", "difference"], 3, 1, 2);
const advanced2 = advanceHypothesis(hyp2, true);
assertEquals(advanced2.phaseIndex, 0, 'phaseIndex wraps to 0');
assertEquals(advanced2.c, 5, 'c advances to (2 + 3) % 6 = 5');

const hyp3 = new Hypothesis(["sum", "difference"], 2, 0, 1);
const notAdvanced = advanceHypothesis(hyp3, false);
assertEquals(notAdvanced.phaseIndex, 0, 'phaseIndex stays 0 when exited is false');
assertEquals(notAdvanced.c, 1, 'c stays 1 when exited is false');

console.log("\n=== initialHypotheses Function ===");
const hypotheses = initialHypotheses();
assertEquals(hypotheses.length, 10, 'Should have 10 hypotheses (2 rotations × 5 offsets)');
const offsets = new Set(hypotheses.map(h => h.offset));
assertEquals(offsets.size, 5, 'All 5 offsets should be present');
assert(hypotheses.every(h => h.phaseIndex === 0), 'All should start at phaseIndex 0');
assert(hypotheses.every(h => h.c === 0), 'All should start with c = 0');

console.log("\n=== filterHypotheses Function ===");
const testHyp = new Hypothesis(["sum", "difference"], 2, 0, 0);
const testHyps = [testHyp];

const filtered = filterHypotheses(testHyps, 1, 2, 3, 3, "both");
assertEquals(filtered.length, 1, 'Hypothesis matching "both" feedback should be kept');
assertEquals(filtered[0].phaseIndex, 1, 'Should advance phase after "both"');
assertEquals(filtered[0].c, 2, 'Should advance c after "both"');

const filtered2 = filterHypotheses(testHyps, 1, 2, 3, 3, "neither");
assertEquals(filtered2.length, 0, 'Hypothesis not matching "neither" should be filtered out');

console.log("\n=== chooseAutoplayGuess Function ===");
const hyps = [
    new Hypothesis(["sum", "difference"], 1, 0, 0),
    new Hypothesis(["sum", "difference"], 2, 0, 0)
];
const guess = chooseAutoplayGuess(hyps, 1, 1);
assert([1, 2, 3, 4, 5, 6].includes(guess), `Autoplay guess should be 1-6, got ${guess}`);

console.log("\n=== getPermutations Function ===");
const perms = getPermutations(["sum", "difference"]);
assertEquals(perms.length, 2, 'Should have 2 permutations for 2 items');

console.log("\n" + "=".repeat(50));
const total = passCount + failCount;
if (failCount === 0) {
    console.log(`\n✅ All ${total} tests PASSED!\n`);
    process.exit(0);
} else {
    console.log(`\n❌ ${failCount} of ${total} tests FAILED\n`);
    process.exit(1);
}
