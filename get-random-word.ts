type WordScore = {
    word: string,
    score: number
}
const allScoredWords: WordScore[] = require("./data/sorted-output-morley-algo.json");

const idx = Math.floor(Math.random() * allScoredWords.length);
console.log(allScoredWords[idx].word);