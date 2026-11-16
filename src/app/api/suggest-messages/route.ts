import { NextResponse } from 'next/server';

const QUESTION_POOL = [
  "What's a hobby you've recently started?",
  'If you could have dinner with any historical figure, who would it be?',
  "What's a simple thing that makes you happy?",
  "What's the best piece of advice you've ever received?",
  'If you could live anywhere in the world for a year, where would it be?',
  "What's a skill you wish you had?",
  "What's a song you can listen to on repeat?",
  "What's the most underrated food?",
  'If you could instantly master one language, which one?',
  "What's a small win you had this week?",
  "What's a movie you think everyone should watch once?",
  'What would your perfect weekend look like?',
  "What's something you learned recently that surprised you?",
  'If you could time-travel, would you go to the past or the future?',
  "What's a habit you're proud of building?",
  "What's your go-to comfort food?",
  "What's a place that always makes you feel calm?",
  'Who is someone that inspires you, and why?',
  "What's a book that changed how you think?",
  'If you had a free day with no obligations, what would you do?',
  "What's a tradition you love?",
  "What's your favorite way to spend a rainy day?",
  "What's one thing on your bucket list?",
  "What's a compliment you've never forgotten?",
  'If you could have any superpower for a day, what would you pick?',
  "What's a smell that brings back a strong memory?",
  "What's the best trip you've ever taken?",
  "What's a game you loved as a kid?",
  'If you could swap lives with someone for a day, who would it be?',
  "What's something you're looking forward to?",
  "What's a food you refused to try and then loved?",
  'What do you do to recharge after a long day?',
  "What's a topic you could talk about for hours?",
  "What's a goal you're working toward right now?",
  'If you opened a shop, what would it sell?',
  "What's the kindest thing a stranger has done for you?",
  "What's your favorite season, and why?",
  "What's a piece of technology you can't live without?",
  "What's a question you wish people asked you more often?",
  'If your life were a movie, what would the title be?',
];

const SUGGESTION_COUNT = 3;

export async function POST() {
  const shuffled = [...QUESTION_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return NextResponse.json({ suggestions: shuffled.slice(0, SUGGESTION_COUNT) });
}
