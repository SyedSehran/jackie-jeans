export interface FitProfile {
  height?: string;
  weight?: string | null;
  waist?: string;
  hip?: string;
  waistFit?: string;
  rise?: string;
  thighFit?: string;
  brands?: string[];
  brandSizes?: Record<string, string>;
  frustration?: string;
}

export type QuestionType = 'dropdown' | 'number-optional' | 'single-select' | 'multi-select' | 'per-brand';

export interface QuizQuestion {
  id: keyof FitProfile | 'brandSizes';
  number: number;
  question: string;
  voiceQuestion: string;
  type: QuestionType;
  options?: string[];
  optional?: boolean;
  skipLabel?: string;
  dependsOn?: keyof FitProfile;
  hint?: string;
}

export const HEIGHTS = [
  "4'10\"", "4'11\"",
  "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"",
  "6'0\"", "6'1\"", "6'2\""
];

export const WAISTS = Array.from({ length: 29 }, (_, i) => `${i + 24}"`);
export const HIPS = Array.from({ length: 29 }, (_, i) => `${i + 32}"`);

export const BRANDS = [
  "Levi's", "Wrangler", "Lee", "Gap", "Banana Republic",
  "Madewell", "Everlane", "H&M", "Zara", "ASOS",
  "7 For All Mankind", "AG Jeans", "Paige", "Frame", "Good American",
  "Abercrombie & Fitch", "American Eagle", "Uniqlo", "Old Navy", "Lucky Brand"
];

export const SIZES = [
  "00", "0", "2", "4", "6", "8", "10", "12", "14", "16",
  "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "36", "38", "40"
];

export const FRUSTRATIONS = [
  "Waist gap",
  "Hip tightness",
  "Wrong length",
  "Thigh fit",
  "Rise position",
  "Other"
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'height',
    number: 1,
    question: "What's your height?",
    voiceQuestion: "Let's start with your height. What is it?",
    type: 'dropdown',
    options: HEIGHTS,
    hint: "We use this to get your inseam length just right."
  },
  {
    id: 'weight',
    number: 2,
    question: "What's your weight?",
    voiceQuestion: "What's your weight in pounds? You can skip this if you'd prefer.",
    type: 'number-optional',
    optional: true,
    skipLabel: "Skip — I'd rather not share",
    hint: "Optional. Helps us fine-tune proportional fit."
  },
  {
    id: 'waist',
    number: 3,
    question: "Waist measurement in inches",
    voiceQuestion: "What's your waist measurement in inches — at the narrowest point?",
    type: 'dropdown',
    options: WAISTS,
    hint: "Measure at the narrowest point, usually above the belly button."
  },
  {
    id: 'hip',
    number: 4,
    question: "Hip measurement in inches",
    voiceQuestion: "What about your hip measurement in inches — at the fullest point?",
    type: 'dropdown',
    options: HIPS,
    hint: "Measure at the fullest point around your hips and seat."
  },
  {
    id: 'waistFit',
    number: 5,
    question: "How do you like jeans to fit at the waist?",
    voiceQuestion: "How do you like jeans to fit at the waist — snug, slightly relaxed, or relaxed?",
    type: 'single-select',
    options: ["Snug", "Slightly relaxed", "Relaxed"],
    hint: "Same measurements can feel very different based on preference."
  },
  {
    id: 'rise',
    number: 6,
    question: "Where should the waistband sit?",
    voiceQuestion: "Where should the waistband sit — high rise, mid rise, or low rise?",
    type: 'single-select',
    options: ["High rise", "Mid rise", "Low rise"],
    hint: "This narrows your style recommendation significantly."
  },
  {
    id: 'thighFit',
    number: 7,
    question: "How should jeans fit through the thighs?",
    voiceQuestion: "How should jeans fit through the thighs — fitted, relaxed, or loose?",
    type: 'single-select',
    options: ["Fitted", "Relaxed", "Loose"],
    hint: "Thigh fit is the second most common complaint after the waist."
  },
  {
    id: 'brands',
    number: 8,
    question: "Which denim brands have you bought before?",
    voiceQuestion: "Which denim brands have you bought before? You can name a few, or say all that apply.",
    type: 'multi-select',
    options: BRANDS,
    hint: "Select all that apply. This helps us calibrate against sizing you already know."
  },
  {
    id: 'brandSizes',
    number: 9,
    question: "What size did you buy in each brand?",
    voiceQuestion: "What size did you buy in each of those brands?",
    type: 'per-brand',
    dependsOn: 'brands',
    hint: "This is our most accurate data point for recommendations."
  },
  {
    id: 'frustration',
    number: 10,
    question: "Biggest fit frustration when buying jeans?",
    voiceQuestion: "Last one — what's your biggest fit frustration when buying jeans?",
    type: 'single-select',
    options: FRUSTRATIONS,
    hint: "We use this to personalize how we explain your recommendation."
  }
];
