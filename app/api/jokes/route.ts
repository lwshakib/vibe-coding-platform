import { NextResponse } from 'next/server';

const jokes = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "What do you call a fake noodle? An impasta!",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "Why don't skeletons fight each other? They don't have the guts.",
  "What do you call cheese that isn't yours? Nacho cheese.",
  "Why did the bicycle fall over? Because it was two-tired!",
  "What do you call a snowman with a six pack? An abdominal snowman.",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one.",
  "I'm on a seafood diet. I see food and I eat it.",
  "Parallel lines have so much in common. It’s a shame they’ll never meet."
];

export async function GET() {
  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
  return NextResponse.json({ joke: randomJoke });
}
