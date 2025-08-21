// Random waiting quotes for summary generation
export const waitingQuotes = [
  "Brewing insight… ☕",
  "Fact-checking the universe…",
  "Summarizing the signal from the noise…",
  "Crunching words into wisdom…",
  "Distilling the essence… 🧪",
  "Reading between the lines…",
  "Connecting the dots… 🔗",
  "Extracting the golden nuggets…",
  "Weaving the story together…",
  "Decoding the important bits… 🔍",
  "Transforming text into insight…",
  "Capturing the core message…",
  "Filtering signal from noise… 📡",
  "Crystallizing the key points…",
  "Mapping the narrative… 🗺️",
  "Condensing complexity…"
];

export const getRandomQuote = (): string => {
  const randomIndex = Math.floor(Math.random() * waitingQuotes.length);
  return waitingQuotes[randomIndex];
};