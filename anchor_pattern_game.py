import random
from dataclasses import dataclass
from itertools import permutations

PHASES = ["sum", "difference"] # leave "product" off the list of options so it's even easier


@dataclass(frozen=True)
class Hypothesis:
    rotation: tuple[str, str, str]
    offset: int
    phase_index: int = 0
    c: int = 0


def mod6_to_die(value: int) -> int:
    value %= 6
    return 6 if value == 0 else value


def compute_correct_value(phase: str, a: int, b: int, c: int) -> int:
    if phase == "sum":
        return mod6_to_die(a + b + c)
    if phase == "difference":
        return mod6_to_die(a - b + c)
    if phase == "product":
        return mod6_to_die(a * b + c)
    raise ValueError(f"Unknown phase: {phase}")


def get_player_guess() -> int:
    while True:
        raw = input("What is your guess for the third value (1-6)? ").strip()
        if raw in {"1", "2", "3", "4", "5", "6"}:
            return int(raw)
        print("Please enter a whole number from 1 to 6.")


def choose_mode() -> str:
    while True:
        raw = input("Choose mode: [1] play yourself, [2] autoplay: ").strip().lower()
        if raw in {"1", "play", "manual", "m"}:
            return "manual"
        if raw in {"2", "auto", "autoplay", "a"}:
            return "autoplay"
        print("Please enter 1 or 2.")


def initial_hypotheses() -> list[Hypothesis]:
    return [
        Hypothesis(rotation=rotation, offset=offset)
        for rotation in permutations(PHASES)
        for offset in range(1, 6)
    ]


def classify_feedback(correct_value: int, guess: int, roll: int) -> str:
    guess_correct = guess == correct_value
    roll_correct = roll == correct_value
    if guess_correct and roll_correct:
        return "both"
    if roll_correct:
        return "roll_only"
    if guess_correct:
        return "guess_only"
    return "neither"


def advance_hypothesis(hypothesis: Hypothesis, exited_phase: bool) -> Hypothesis:
    if not exited_phase:
        return hypothesis
    next_phase_index = (hypothesis.phase_index + 1) % len(hypothesis.rotation)
    next_c = (hypothesis.c + hypothesis.offset) % 6
    return Hypothesis(
        rotation=hypothesis.rotation,
        offset=hypothesis.offset,
        phase_index=next_phase_index,
        c=next_c,
    )


def filter_hypotheses(
    hypotheses: list[Hypothesis],
    a: int,
    b: int,
    guess: int,
    roll: int,
    observed_feedback: str,
) -> list[Hypothesis]:
    kept: list[Hypothesis] = []
    for hypothesis in hypotheses:
        phase = hypothesis.rotation[hypothesis.phase_index]
        correct_value = compute_correct_value(phase, a, b, hypothesis.c)
        predicted_feedback = classify_feedback(correct_value, guess, roll)
        if predicted_feedback == observed_feedback:
            kept.append(advance_hypothesis(hypothesis, predicted_feedback == "both"))
    return kept


def choose_autoplay_guess(hypotheses: list[Hypothesis], a: int, b: int) -> int:
    counts = {value: 0 for value in range(1, 7)}
    for hypothesis in hypotheses:
        phase = hypothesis.rotation[hypothesis.phase_index]
        correct_value = compute_correct_value(phase, a, b, hypothesis.c)
        counts[correct_value] += 1
    best_count = max(counts.values())
    best_values = [value for value, count in counts.items() if count == best_count]
    return random.choice(best_values)


def feedback_message(feedback: str) -> str:
    messages = {
        "both": [
            "Okay, fine, the roll was right.",
            "Ugh, yes, that roll was right.",
            "Yep, the roll was right. Happy now?",
            "Sure, the roll was right. Try not to get smug about it.",
        ],
        "roll_only": [
            "Eww, yeah, that guess is still off but you did roll correctly. Keep going!",
            "Well, the guess missed, but the roll landed right. Grossly effective.",
            "Nope on the guess, but somehow the roll nailed it.",
            "That guess was a mess, but the roll was right. Counts for something, I guess.",
        ],
        "guess_only": [
            "Yeah, that guess was right. I think you are getting it.",
            "Alright, your guess was right. Maybe you're not hopeless.",
            "Fine, the guess was right. Don't let it go to your head.",
            "That guess was right. Irritatingly competent.",
        ],
        "neither": [
            "Nope. That guess and roll were both junk.",
            "Eww, no. You're still off on both.",
            "Not even close. Guess and roll both missed.",
            "Yeah... no. Nothing right that round.",
        ],
    }
    return random.choice(messages[feedback])


def main() -> None:
    mode = choose_mode()
    rotation = random.sample(PHASES, k=len(PHASES))
    current_phase_index = 0
    c = 0
    offset = random.randint(1, 5)
    streak = 0
    round_number = 1
    hypotheses = initial_hypotheses()

    print("Anchor Pattern")
    print("--------------")
    print("Win condition: get two rounds in a row where your guess is correct and your roll is correct.")
    if mode == "autoplay":
        print("Autoplay mode is on. I will make the guesses.")
    print()

    while streak < 2:
        phase = rotation[current_phase_index]
        a = random.randint(1, 6)
        b = random.randint(1, 6)
        correct_value = compute_correct_value(phase, a, b, c)

        print(f"Round {round_number}")
        print(f"Anchor roll: {a}")
        print(f"Pattern-setter roll: {b}")

        if mode == "autoplay":
            guess = choose_autoplay_guess(hypotheses, a, b)
            print(f"Autoplay guess: {guess}")
        else:
            guess = get_player_guess()

        roll = random.randint(1, 6)
        print(f"Your third roll: {roll}")

        feedback = classify_feedback(correct_value, guess, roll)
        print(f"Feedback: {feedback_message(feedback)}")

        if feedback == "both":
            streak += 1
            current_phase_index = (current_phase_index + 1) % len(rotation)
            c = (c + offset) % 6
        else:
            streak = 0

        hypotheses = filter_hypotheses(hypotheses, a, b, guess, roll, feedback)
        if not hypotheses:
            hypotheses = initial_hypotheses()

        print(f"Current win streak: {streak}")
        if mode == "autoplay":
            print(f"Remaining candidate theories: {len(hypotheses)}")
        print()
        round_number += 1

    if mode == "autoplay":
        print(f"See, that was easy, I figured it out in {round_number - 1} rounds!!!")
    else:
        print(f"You win in {round_number - 1} rounds!")
    print(f"Hidden rotation was: {' -> '.join(rotation)}")
    print(f"Hidden offset was: {offset}")


if __name__ == "__main__":
    main()
