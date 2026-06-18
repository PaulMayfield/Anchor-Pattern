import matplotlib.pyplot as plt
import statistics
import random

from anchor_pattern_game import (
    PHASES,
    compute_correct_value,
    classify_feedback,
    choose_autoplay_guess,
    filter_hypotheses,
    initial_hypotheses,
)


def autoplay_single_game():
    """
    Runs ONE autoplay game silently and returns:
    - rounds_to_win
    - rounds_to_deduction (or None if never deduced)
    """

    rotation = random.sample(PHASES, k=len(PHASES))
    current_phase_index = 0
    c = 0
    offset = random.randint(1, 5)
    streak = 0
    round_number = 1
    hypotheses = initial_hypotheses()

    deduction_round = None

    while streak < 2:
        phase = rotation[current_phase_index]
        a = random.randint(1, 6)
        b = random.randint(1, 6)
        correct_value = compute_correct_value(phase, a, b, c)

        guess = choose_autoplay_guess(hypotheses, a, b)
        roll = random.randint(1, 6)
        feedback = classify_feedback(correct_value, guess, roll)

        # Update hypotheses FIRST
        hypotheses = filter_hypotheses(hypotheses, a, b, guess, roll, feedback)

        # Track deduction BEFORE checking win condition
        if deduction_round is None and len(hypotheses) == 1:
            deduction_round = round_number

        # Update streak + phase/c
        if feedback == "both":
            streak += 1
            current_phase_index = (current_phase_index + 1) % len(rotation)
            c = (c + offset) % 6
        else:
            streak = 0

        # Reset hypotheses if empty (rare)
        if not hypotheses:
            hypotheses = initial_hypotheses()

        round_number += 1

    rounds_to_win = round_number - 1
    return rounds_to_win, deduction_round


def run_autoplay_simulation(n=10000):
    win_results = []
    deduction_results = []

    for _ in range(n):
        rounds_to_win, deduction_round = autoplay_single_game()
        win_results.append(rounds_to_win)
        deduction_results.append(deduction_round)

    return win_results, deduction_results


def plot_results(win_results, deduction_results):
    plt.figure(figsize=(10, 6))
    plt.hist(
        win_results,
        bins=range(min(win_results), max(win_results) + 2),
        edgecolor="black",
        alpha=0.75,
    )
    plt.title("Distribution of Rounds to Win (Autoplay Mode)")
    plt.xlabel("Rounds to Win")
    plt.ylabel("Frequency")
    plt.grid(axis="y", linestyle="--", alpha=0.5)

    # Compute stats
    mean_win = statistics.mean(win_results)
    median_win = statistics.median(win_results)

    numeric_deductions = [d for d in deduction_results if d is not None]
    missing_count = len(deduction_results) - len(numeric_deductions)

    if numeric_deductions:
        mean_deduction = statistics.mean(numeric_deductions)
        median_deduction = statistics.median(numeric_deductions)
        mean_deduction_str = f"{mean_deduction:.2f}"
        median_deduction_str = f"{median_deduction}"
    else:
        mean_deduction_str = "N/A"
        median_deduction_str = "N/A"

    # Build stats text (all formatting done safely)
    stats_text = (
        f"Runs: {len(win_results):,}\n"
        f"Win Mean: {mean_win:.2f}\n"
        f"Win Median: {median_win}\n"
        f"Deduction Mean: {mean_deduction_str}\n"
        f"Deduction Median: {median_deduction_str}\n"
        f"No Deduction: {missing_count}"
    )

    # Add text box in upper right
    plt.text(
        0.98,
        0.98,
        stats_text,
        transform=plt.gca().transAxes,
        fontsize=10,
        verticalalignment="top",
        horizontalalignment="right",
        bbox=dict(facecolor="white", alpha=0.8, edgecolor="black"),
    )

    plt.show()


def main():
    print("Running 10,000 autoplay simulations...\n")

    win_results, deduction_results = run_autoplay_simulation(10000)

    plot_results(win_results, deduction_results)


if __name__ == "__main__":
    main()
