import { z } from "zod";

import { emailSchema } from "@/lib/validation/primitives";

const COMMON_PASSWORDS = new Set([
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "monkey",
  "1234567",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "111111",
  "iloveyou",
  "master",
  "sunshine",
  "ashley",
  "bailey",
  "passw0rd",
  "shadow",
  "123123",
  "654321",
  "superman",
  "qazwsx",
  "michael",
  "football",
  "secret",
  "joshua",
  "7777777",
  "amanda",
  "nicole",
  "chelsea",
  "biteme",
  "matthew",
  "access",
  "yankees",
  "987654321",
  "dallas",
  "austin",
  "thunder",
  "taylor",
  "matrix",
  "mobilemail",
  "mom",
  "monitor",
  "monitoring",
  "montana",
  "moon",
  "moscow",
  "mustang",
  "nirvana",
  "nissan",
  "nobody",
  "nobod",
  "nosferatu",
  "nothing",
  "orange",
  "orlando",
  "packers",
  "pantera",
  "pandora",
  "patrick",
  "pepper",
  "phantom",
  "phoenix",
  "pittsburgh",
  "pokemon",
  "poland",
  "power",
  "prince",
  "princess",
  "peanuts",
  "pearljam",
  "pepper",
  "phoenix",
  "pirates",
  "playstation",
  "pokemon",
  "porsche",
  "producer",
  "psychic",
  "pudding",
  "pumpkin",
  "purple",
  "rabbit",
  "rachel",
  "racing",
  "raider",
  "rainbow",
  "ranger",
  "rangers",
  "rascal",
  "rebecca",
  "redskins",
  "redsox",
  "reggie",
  "republic",
  "rebel",
  "redrum",
  "redwings",
  "rhino",
  "richard",
  "robert",
  "robin",
  "rock",
  "rocket",
  "rocky",
  "roland",
  "romance",
  "romeo",
  "rooster",
  "rosebud",
  "rover",
  "russia",
  "russian",
  "sabrina",
  "saddle",
  "sagittarius",
  "saints",
  "sally",
  "samantha",
  "sammy",
  "samson",
  "sandra",
  "santana",
  "sara",
  "sarah",
  "sasha",
  "satan",
  "savannah",
  "scooby",
  "scooter",
  "scorpio",
  "scott",
  "scout",
  "scorpion",
  "seattle",
  "seinfeld",
  "serenity",
  "shadow",
  "shannon",
  "sharon",
  "shawn",
  "sheba",
  "sheep",
  "shelby",
  "sherman",
  "sherry",
  "shiva",
  "shorty",
  "show",
  "sierra",
  "simon",
  "siren",
  "skater",
  "skittles",
  "sky",
  "skylar",
  "slayer",
  "slipknot",
  "sloth",
  "smith",
  "smokey",
  "snoopy",
  "snowball",
  "snowwhite",
  "soccer",
  "socrates",
  "sonic",
  "sonja",
  "sonny",
  "southpark",
  "space",
  "spider",
  "spiderman",
  "sport",
  "sports",
  "spot",
  "spungebob",
  "squirtle",
  "stanford",
  "star",
  "starfish",
  "stars",
  "starwars",
  "startrek",
  "stella",
  "stephanie",
  "steven",
  "stick",
  "stinky",
  "stone",
  "storm",
  "strawberry",
  "sublime",
  "success",
  "suck",
  "sucker",
  "sugar",
  "sultan",
  "summer",
  "sunshine",
  "superman",
  "super",
  "surfer",
  "susan",
  "suzanne",
  "suzuki",
  "swan",
  "swedish",
  "sweet",
  "sweetheart",
  "sweetie",
  "sweety",
  "swift",
  "system",
  "taco",
  "tadpole",
  "taurus",
  "taxi",
  "teacher",
  "teapot",
  "teddy",
  "tennis",
  "terrance",
  "terry",
  "texas",
  "thankyou",
  "thelma",
  "theman",
  "theodore",
  "theresa",
  "these",
  "thomas",
  "thunder",
  "thunderbird",
  "tiger",
  "tigers",
  "tigger",
  "timmy",
  "tinkerbell",
  "titanic",
  "tits",
  "toad",
  "toast",
  "tobias",
  "today",
  "toilet",
  "tom",
  "tomcat",
  "tommy",
  "tony",
  "tool",
  "top",
  "topgun",
  "topsecret",
  "totem",
  "toyota",
  "toys",
  "tractor",
  "traffic",
  "tragic",
  "train",
  "trains",
  "tramp",
  "trash",
  "travis",
  "trek",
  "trey",
  "trinity",
  "trinity",
  "trinity",
  "trinity",
  "tripod",
  "trouble",
  "truck",
  "trucks",
  "trumpet",
  "trust",
  "trustno1",
  "truth",
  "tucker",
  "turtle",
  "turtles",
  "tv",
  "tweety",
  "twilight",
  "twins",
  "twisted",
  "tyler",
  "tyrone",
  "ultimate",
  "uncle",
  "under",
  "underdog",
  "unicorn",
  "unique",
  "united",
  "unknown",
  "unlock",
  "unreal",
  "up",
  "upper",
  "upskirt",
  "uranus",
  "us",
  "user",
  "username",
  "users",
  "usher",
  "vacation",
  "valerie",
  "vampire",
  "vanilla",
  "vatican",
  "velvet",
  "ventura",
  "venus",
  "veronica",
  "victor",
  "victoria",
  "video",
  "videos",
  "viking",
  "vikings",
  "violet",
  "virgin",
  "virginia",
  "virus",
  "vision",
  "visitor",
  "vista",
  "visual",
  "vitamin",
  "vodka",
  "volcano",
  "volleyball",
  "voyager",
  "wagner",
  "waldo",
  "walker",
  "wallace",
  "walnut",
  "wanderer",
  "wang",
  "wanker",
  "want",
  "war",
  "warcraft",
  "warden",
  "warrior",
  "warriors",
  "wars",
  "washington",
  "waste",
  "watch",
  "watcher",
  "water",
  "waterfall",
  "waters",
  "wave",
  "waves",
  "wayne",
  "weak",
  "wealth",
  "weapon",
  "wear",
  "weather",
  "web",
  "webcam",
  "webmaster",
  "website",
  "wedding",
  "weed",
  "weekend",
  "weird",
  "welcome",
  "wendy",
  "west",
  "western",
  "westeros",
  "whale",
  "what",
  "wheel",
  "wheels",
  "whiskey",
  "whisky",
  "white",
  "whitney",
  "who",
  "whole",
  "why",
  "wicked",
  "wide",
  "wife",
  "wii",
  "wild",
  "wildcats",
  "wilde",
  "will",
  "william",
  "williams",
  "willie",
  "willow",
  "willy",
  "win",
  "wind",
  "window",
  "windows",
  "winds",
  "windy",
  "wine",
  "wing",
  "wings",
  "winner",
  "winston",
  "winter",
  "wisdom",
  "wise",
  "wish",
  "witch",
  "with",
  "without",
  "wolf",
  "wolves",
  "woman",
  "women",
  "wonder",
  "wonderful",
  "wood",
  "woods",
  "woody",
  "word",
  "words",
  "work",
  "worker",
  "working",
  "works",
  "world",
  "worlds",
  "worm",
  "worms",
  "worry",
  "worse",
  "worst",
  "worth",
  "would",
  "wow",
  "wrap",
  "wrath",
  "wrestling",
  "wright",
  "write",
  "writer",
  "writing",
  "written",
  "wrong",
  "yard",
  "yeah",
  "year",
  "yellow",
  "yes",
  "yesterday",
  "yet",
  "you",
  "young",
  "your",
  "yours",
  "yourself",
  "youth",
  "zebra",
  "zebras",
  "zero",
  "zip",
  "zombie",
  "zombies",
  "zone",
  "zones",
  "zoom",
  "1234567890",
  "123123123",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  "1q2w3e4r",
  "password1",
  "password123",
  "admin",
  "administrator",
  "root",
  "test",
  "guest",
  "user",
  "login",
  "welcome",
  "hello",
  "love",
  "god",
  "money",
  "freedom",
  "whatever",
  "whatever",
  "qazwsx",
  "zaq12wsx",
]);

const passwordRequirementsSchema = z.object({
  password: z
    .string()
    .min(12, "Password must be at least 12 characters long")
    .max(128, "Password must be less than 128 characters")
    .refine((val) => /[a-z]/.test(val), "Password must contain at least one lowercase letter")
    .refine((val) => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
    .refine((val) => /[0-9]/.test(val), "Password must contain at least one number")
    .refine(
      (val) => /[^a-zA-Z0-9]/.test(val),
      "Password must contain at least one special character (!@#$%^&* etc.)",
    )
    .refine(
      (val) => !isCommonPassword(val),
      "This password is too common. Please choose a more unique password.",
    )
    .refine(
      (val) => !passwordMatchesEmail(val),
      "Password must not be similar to your email address",
    ),
  email: emailSchema.optional(),
});

export type PasswordRequirementsInput = z.infer<typeof passwordRequirementsSchema>;

export type PasswordValidationError = {
  valid: false;
  error: string;
  code: string;
};

export type PasswordValidationSuccess = {
  valid: true;
  strength: "weak" | "fair" | "good" | "strong";
};

export type PasswordValidationResult = PasswordValidationError | PasswordValidationSuccess;

function calculateEntropy(password: string): number {
  const charsetSize = (() => {
    let size = 0;
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/[0-9]/.test(password)) size += 10;
    if (/[^a-zA-Z0-9]/.test(password)) size += 32;
    return size;
  })();

  return password.length * Math.log2(charsetSize || 1);
}

function passwordMatchesEmail(password: string, email?: string): boolean {
  if (!email) return false;

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPassword = password.toLowerCase().trim();

  if (normalizedPassword === normalizedEmail) return true;

  if (normalizedPassword.includes(normalizedEmail)) return true;

  if (normalizedPassword.length >= 4 && normalizedEmail.includes(normalizedPassword)) {
    return true;
  }

  const emailLocal = normalizedEmail.split("@")[0];
  if (emailLocal && normalizedPassword.includes(emailLocal)) {
    return true;
  }

  return false;
}

function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return COMMON_PASSWORDS.has(lowerPassword);
}

function determineStrength(password: string): "weak" | "fair" | "good" | "strong" {
  const entropy = calculateEntropy(password);
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (entropy < 35 || varietyCount < 2) {
    return "weak";
  }

  if (entropy < 50 || varietyCount < 3) {
    return "fair";
  }

  if (entropy < 70 || varietyCount < 4) {
    return "good";
  }

  return "strong";
}

export function validatePassword(password: string, email?: string): PasswordValidationResult {
  const zodResult = passwordRequirementsSchema.safeParse({ password, email });

  if (!zodResult.success) {
    const firstError = zodResult.error.errors[0];
    const code = firstError.path[0] === "password" ? "VALIDATION_ERROR" : "EMAIL_ERROR";
    return {
      valid: false,
      error: firstError.message,
      code,
    };
  }

  const strength = determineStrength(password);

  if (strength === "weak") {
    return {
      valid: false,
      error: "Password is too weak. Please add more variety or length.",
      code: "TOO_WEAK",
    };
  }

  return {
    valid: true,
    strength,
  };
}

export type PasswordRequirement = {
  label: string;
  met: boolean;
};

export function checkPasswordRequirements(password: string, email?: string): PasswordRequirement[] {
  return [
    {
      label: "At least 12 characters",
      met: password.length >= 12,
    },
    {
      label: "Contains uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number",
      met: /[0-9]/.test(password),
    },
    {
      label: "Contains special character",
      met: /[^a-zA-Z0-9]/.test(password),
    },
    {
      label: "Not a common password",
      met: !isCommonPassword(password),
    },
    {
      label: "Not similar to email",
      met: !passwordMatchesEmail(password, email),
    },
  ];
}
