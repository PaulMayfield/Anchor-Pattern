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
    let result = value % 6;
    if (result <= 0) result += 6;
    return result;
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

function feedbackMessage(feedback) {
    const messages = {
        both: [
            "Okay, fine, the roll was right.",
            "Ugh, yes, that roll was right.",
            "Yep, the roll was right. Happy now?",
            "Sure, the roll was right. Try not to get smug about it.",
        ],
        roll_only: [
            "Eww, yeah, that guess is still off but you did roll correctly. Keep going!",
            "Well, the guess missed, but the roll landed right. Grossly effective.",
            "Nope on the guess, but somehow the roll nailed it.",
            "That guess was a mess, but the roll was right. Counts for something, I guess.",
        ],
        guess_only: [
            "Yeah, that guess was right. I think you are getting it.",
            "Alright, your guess was right. Maybe you're not hopeless.",
            "Fine, the guess was right. Don't let it go to your head.",
            "That guess was right. Irritatingly competent.",
        ],
        neither: [
            "Nope. That guess and roll were both junk.",
            "Eww, no. You're still off on both.",
            "Not even close. Guess and roll both missed.",
            "Yeah... no. Nothing right that round.",
        ],
    };
    const msgs = messages[feedback];
    return msgs[Math.floor(Math.random() * msgs.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Game state
class GameState {
    constructor(mode) {
        this.mode = mode;
        this.rotation = shuffle([...PHASES]);
        this.currentPhaseIndex = 0;
        this.c = 0;
        this.offset = randomInt(1, 5);
        this.streak = 0;
        this.roundNumber = 1;
        this.hypotheses = initialHypotheses();
        this.currentGuess = null;
        this.currentA = null;
        this.currentB = null;
        this.currentRoll = null;
    }
}

let gameState = null;

// UI Event Listeners - only attach if elements exist
const manualBtn = document.getElementById("manual-btn");
const autoplayBtn = document.getElementById("autoplay-btn");
const startBtn = document.getElementById("start-btn");
const nextRoundBtn = document.getElementById("next-round-btn");
const playAgainBtn = document.getElementById("play-again-btn");

if (manualBtn) manualBtn.addEventListener("click", () => {
    selectMode("manual");
});

if (autoplayBtn) autoplayBtn.addEventListener("click", () => {
    selectMode("autoplay");
});

if (startBtn) startBtn.addEventListener("click", startGame);

document.querySelectorAll(".guess-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        handleGuess(parseInt(e.target.dataset.value));
    });
});

if (nextRoundBtn) nextRoundBtn.addEventListener("click", () => {
    gameState.roundNumber++;
    nextRound();
});

if (playAgainBtn) playAgainBtn.addEventListener("click", () => location.reload());

// Initialize mode selector to "manual" (matches the active button on page load)
document.querySelector(".mode-selector").dataset.mode = "manual";

function selectMode(mode) {
    const manualBtn = document.getElementById("manual-btn");
    const autoplayBtn = document.getElementById("autoplay-btn");
    
    if (mode === "manual") {
        manualBtn.classList.add("active");
        autoplayBtn.classList.remove("active");
    } else {
        autoplayBtn.classList.add("active");
        manualBtn.classList.remove("active");
    }
    document.querySelector(".mode-selector").dataset.mode = mode;
}

function startGame() {
    const mode = document.querySelector(".mode-selector").dataset.mode || "manual";
    console.log(`[startGame] Mode selector dataset.mode: ${document.querySelector(".mode-selector").dataset.mode}`);
    console.log(`[startGame] Starting game with mode: ${mode}`);
    gameState = new GameState(mode);
    console.log(`[startGame] GameState created: mode=${gameState.mode}`);
    
    document.getElementById("game-setup").classList.add("hidden");
    document.getElementById("game-board").classList.remove("hidden");
    
    gameState.roundNumber = 1;
    console.log(`[startGame] Calling nextRound...`);
    nextRound();
}

function nextRound() {
    console.log(`[nextRound] Round ${gameState.roundNumber}, Mode: ${gameState.mode}, Streak: ${gameState.streak}`);
    
    const phase = gameState.rotation[gameState.currentPhaseIndex];
    gameState.currentA = randomInt(1, 6);
    gameState.currentB = randomInt(1, 6);
    gameState.currentRoll = null;
    gameState.currentGuess = null;
    
    console.log(`[nextRound] Rolls: A=${gameState.currentA}, B=${gameState.currentB}, Phase=${phase}`);
    
    document.getElementById("round-number").textContent = gameState.roundNumber;
    document.getElementById("streak").textContent = gameState.streak;
    document.getElementById("anchor-roll").textContent = gameState.currentA;
    document.getElementById("pattern-roll").textContent = gameState.currentB;
    document.getElementById("third-roll").textContent = "-";
    
    document.getElementById("guess-section").classList.remove("hidden");
    const guessButtonsDiv = document.querySelector(".guess-buttons");
    if (guessButtonsDiv) guessButtonsDiv.classList.remove("hidden");
    document.getElementById("feedback-section").classList.add("hidden");
    document.getElementById("autoplay-guess").classList.add("hidden");
    
    document.querySelectorAll(".guess-btn").forEach(btn => btn.disabled = false);
    
    if (gameState.mode === "autoplay") {
        console.log(`[nextRound] AUTOPLAY MODE - Generating guess...`);
        const autoplayGuess = chooseAutoplayGuess(gameState.hypotheses, gameState.currentA, gameState.currentB);
        console.log(`[nextRound] Autoplay guess: ${autoplayGuess}`);
        gameState.currentGuess = autoplayGuess;
        document.getElementById("autoplay-value").textContent = autoplayGuess;
        document.getElementById("autoplay-guess").classList.remove("hidden");
        const guessButtonsDiv2 = document.querySelector(".guess-buttons");
        if (guessButtonsDiv2) guessButtonsDiv2.classList.add("hidden");
        
        console.log(`[nextRound] Setting timeout for ${autoplayGuess} in 1500ms`);
        // Automatically make the guess after a short delay to show the rolls
        setTimeout(() => {
            console.log(`[nextRound] Timeout fired - calling handleGuess(${autoplayGuess})`);
            handleGuess(autoplayGuess);
        }, 1500);
    }
}

function handleGuess(guess) {
    console.log(`[handleGuess] Called with guess=${guess}, mode=${gameState.mode}`);
    gameState.currentGuess = guess;
    
    // Disable all guess buttons immediately
    document.querySelectorAll(".guess-btn").forEach(btn => btn.disabled = true);
    
    // Roll the third die
    gameState.currentRoll = randomInt(1, 6);
    console.log(`[handleGuess] Third roll: ${gameState.currentRoll}`);
    
    const phase = gameState.rotation[gameState.currentPhaseIndex];
    const correctValue = computeCorrectValue(phase, gameState.currentA, gameState.currentB, gameState.c);
    const feedback = classifyFeedback(correctValue, gameState.currentGuess, gameState.currentRoll);
    console.log(`[handleGuess] Phase: ${phase}, CorrectValue: ${correctValue}, Feedback: ${feedback}`);
    
    // Display results
    document.getElementById("third-roll").textContent = gameState.currentRoll;
    document.getElementById("feedback-message").textContent = feedbackMessage(feedback);
    
    if (gameState.mode === "autoplay") {
        document.getElementById("remaining-theories").textContent = `Remaining candidate theories: ${gameState.hypotheses.length}`;
        document.getElementById("remaining-theories").classList.remove("hidden");
    } else {
        document.getElementById("remaining-theories").classList.add("hidden");
    }
    
    if (feedback === "both") {
        gameState.streak++;
        gameState.currentPhaseIndex = (gameState.currentPhaseIndex + 1) % gameState.rotation.length;
        gameState.c = (gameState.c + gameState.offset) % 6;
        console.log(`[handleGuess] Correct! Streak now: ${gameState.streak}`);
    } else {
        gameState.streak = 0;
        console.log(`[handleGuess] Incorrect. Streak reset to 0`);
    }
    
    gameState.hypotheses = filterHypotheses(
        gameState.hypotheses,
        gameState.currentA,
        gameState.currentB,
        gameState.currentGuess,
        gameState.currentRoll,
        feedback
    );
    console.log(`[handleGuess] Hypotheses remaining: ${gameState.hypotheses.length}`);
    
    if (gameState.hypotheses.length === 0) {
        gameState.hypotheses = initialHypotheses();
        console.log(`[handleGuess] Hypotheses emptied, reset to ${gameState.hypotheses.length}`);
    }
    
    document.getElementById("streak").textContent = gameState.streak;
    
    // Hide guess section and autoplay message
    document.getElementById("guess-section").classList.add("hidden");
    document.getElementById("autoplay-guess").classList.add("hidden");
    const guessButtonsDiv3 = document.querySelector(".guess-buttons");
    if (guessButtonsDiv3) guessButtonsDiv3.classList.remove("hidden");
    
    if (gameState.streak >= 2) {
        console.log(`[handleGuess] VICTORY! Streak >= 2`);
        showVictory();
    } else {
        document.getElementById("feedback-section").classList.remove("hidden");
        
        // In autoplay mode, automatically continue after a delay
        if (gameState.mode === "autoplay") {
            console.log(`[handleGuess] Autoplay mode - scheduling next round in 2000ms`);
            setTimeout(() => {
                console.log(`[handleGuess] 2000ms timeout fired - incrementing round and calling nextRound`);
                gameState.roundNumber++;
                nextRound();
            }, 2000);
        }
    }
}

function showVictory() {
    document.getElementById("game-board").classList.add("hidden");
    document.getElementById("game-over").classList.remove("hidden");
    
    if (gameState.mode === "autoplay") {
        document.getElementById("victory-message").textContent = 
            `See, that was easy, I figured it out in ${gameState.roundNumber - 1} rounds!!!`;
    } else {
        document.getElementById("victory-message").textContent = 
            `You win in ${gameState.roundNumber - 1} rounds!`;
    }
    
    document.getElementById("final-rotation").textContent = 
        `Hidden rotation was: ${gameState.rotation.join(" → ")}`;
    document.getElementById("final-offset").textContent = 
        `Hidden offset was: ${gameState.offset}`;
}

