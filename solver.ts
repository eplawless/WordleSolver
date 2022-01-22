import { createInterface } from "readline";
import colors from "colors";

const readline = createInterface(process.stdin, process.stdout);
function ask(question: string): Promise<string> {
    return new Promise(resolve => readline.question(question, resolve));
}

function unreachable(x: never): never {
    throw new Error("the fuck is you doing");
}

type LetterMatch = "B" | "Y" | "G";
type GuessResult = [LetterMatch, LetterMatch, LetterMatch, LetterMatch, LetterMatch]

function getGuessResult(guess: string, knownAnswer: string): GuessResult | null {
    if (guess.length !== 5 || knownAnswer.length !== 5) {
        return null;
    }
    const result: GuessResult = ["B", "B", "B", "B", "B"];
    for (let idx = 0; idx < 5; ++idx) {
        const letter = guess[idx];
        if (knownAnswer[idx] === letter) {
            result[idx] = "G";
        } else if (knownAnswer.includes(letter)) {
            result[idx] = "Y";
        } else {
            result[idx] = "B";
        }
    }
    return result;
}

function parseGuessResult(input: string): GuessResult | null {
    if (input.length !== 5) {
        return null;
    }
    const result = input.toUpperCase().split("") as GuessResult;
    for (const letter of result) {
        if (letter !== "B" && letter !== "Y" && letter !== "G") {
            return null;
        }
    }
    return result;
}

function colorizeGuessResult(guessResult: GuessResult): string {
    return guessResult.map(letter => {
        switch (letter) {
            case "B": return colors.gray(letter);
            case "G": return colors.green(letter);
            case "Y": return colors.yellow(letter);
            default: unreachable(letter);
        }
    }).join("");
}

function isAnswerValid(guess: string, guessResult: GuessResult, answer: string) {
    for (let idx = 0; idx < 5; ++idx) {
        const letterMatch = guessResult[idx];
        switch (letterMatch) {
            case "B": {
                if (answer.includes(guess[idx])) {
                    return false;
                }
                break;
            }
            case "Y": {
                if (!answer.includes(guess[idx]) || answer[idx] === guess[idx]) {
                    return false;
                }
                break;
            }
            case "G": {
                if (answer[idx] !== guess[idx]) {
                    return false;
                }
                break;
            }
            default: unreachable(letterMatch);
        }
    }
    return true;
}

type WordScore = {
    word: string,
    score: number
}

type ScoresByWord = {
    [word: string]: number | undefined
}

const allScoredWords: WordScore[] = require("./data/sorted-output-morley-algo.json");
const allWords = allScoredWords.map(({ word }) => word);
const scoresByWord = allScoredWords.reduce<ScoresByWord>((acc, entry) => {
    acc[entry.word] = entry.score;
    return acc;
}, {});

function getRandomWord(allScoredWords: WordScore[]): string {
    const idx = Math.floor(Math.random() * allScoredWords.length);
    return allScoredWords[idx].word;
}

async function main() {
    try {
        let knownAnswer: string | null = process.argv[2];
        if (knownAnswer === "random") {
            knownAnswer = getRandomWord(allScoredWords);
        } else if (typeof knownAnswer === "string") {
            knownAnswer = knownAnswer.toLowerCase();
            if (!allWords.includes(knownAnswer)) {
                console.error("invalid answer");
                process.exit(1);
            }
        } else {
            knownAnswer = null;
        }
        const possibleAnswers = new Set<string>(allScoredWords.map(({ word }) => word));
        let iterations = 0;
        while (possibleAnswers.size > 0 && iterations < 6) {
            ++iterations;
            const guess = (await ask(colors.blue("guess: "))).toLowerCase();
            let guessResult = null;
            if (knownAnswer) {
                guessResult = getGuessResult(guess, knownAnswer);
                if (guessResult) {
                    console.log(colors.blue("guess result:"), colorizeGuessResult(guessResult));
                }
            }
            while (guessResult === null) {
                guessResult = parseGuessResult(await ask("guess result: "));
            }
            if (!guessResult.some(value => value !== "G")) {
                knownAnswer = guess;
                break;
            }
            let nextGuess = null;
            let nextGuessScore: number = Infinity;
            for (const answer of possibleAnswers) {
                if (isAnswerValid(guess, guessResult, answer)) {
                    const score = scoresByWord[answer];
                    if (typeof score === "number" && score < nextGuessScore) {
                        nextGuess = answer;
                        nextGuessScore = score;
                    }
                } else {
                    possibleAnswers.delete(answer);
                }
            }
            console.log(colors.blue("recommended:"), colors.yellow(nextGuess || "fuck if I know"));
        }
        if (knownAnswer) { 
            console.log(colors.green("answer: " + knownAnswer));
        }
    } finally {
        readline.close();
    }
}

main();
