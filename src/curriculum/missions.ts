// Real, checkable Python missions for World 1 (Python Village). Every
// mission here runs genuine student code through Pyodide — nothing is
// simulated or hard-coded.
//
// This now covers the brief's Prompt 3 activity types, not just plain
// "Code": a predict-the-output question (optional, shown before the
// editor), the coding challenge itself with one or more test cases
// (including HIDDEN cases — inputs the student never sees, re-run against
// their own code to make sure it's genuinely correct and not just matching
// the one visible example), and an optional bonus debugging challenge
// (student fixes an intentionally broken snippet). The full 9-step cycle
// (story -> learn -> explore -> code -> predict -> debug -> apply -> HOTS
// -> boss) with per-step assessment metadata is still Prompt 4's job —
// this is a genuine, working slice of that cycle for every World 1 level,
// not a mockup of it.

export interface TestCase {
  /** Inputs fed to input() calls, in order, for this run. */
  providedInputs?: string[];
  /** Shown only on failure (e.g. "with 7") — never shown up front. */
  label?: string;
}

export interface PredictQuestion {
  prompt: string;
  snippet: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DebugChallenge {
  intro: string;
  buggyCode: string;
  hint: string;
  check: (stdout: string, code: string) => string | null;
  rewardXp: number;
  rewardCoins: number;
}

export interface Mission {
  id: string;
  title: string;
  topic: string;
  story: string;
  starterCode: string;
  /** The example/default run — always run first, and alone when no hidden testCases exist. */
  providedInputs?: string[];
  /** Additional hidden runs (different inputs) the student's code must also pass. */
  hiddenTestCases?: TestCase[];
  /**
   * Validates one run. `testCase` describes which inputs produced `stdout`
   * (its own `providedInputs`/`label`, or `{}` for the default run) so a
   * mission with hidden test cases can compute the expected result per case
   * instead of hard-coding a single answer.
   */
  check: (stdout: string, code: string, testCase: TestCase) => string | null;
  predict?: PredictQuestion;
  debugChallenge?: DebugChallenge;
  rewardXp: number;
  rewardCoins: number;
}

export function linesOf(stdout: string): string[] {
  return stdout.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
}

const W1_L3_STARTER =
  '# The librarian wants two things from you:\n' +
  '#   1) Your own comment (a line starting with #) explaining what your code does.\n' +
  '#   2) A line that prints exactly: Comments make code readable\n' +
  '#\n' +
  '# Write both below.\n\n';

export const WORLD_1_MISSIONS: Mission[] = [
  {
    id: 'w1-l1',
    title: 'Wake the Village Terminal',
    topic: 'Introduction to Python',
    story:
      'The old village terminal has been asleep for years. Py-Guide says it only wakes up for a real ' +
      'Python programmer. Every Python program starts with a single instruction to the computer. Use ' +
      'the print() function to say hello and bring the terminal back to life: print("Hello, Python Village!")',
    starterCode: `# Welcome to your very first Python program!\n# The terminal only wakes up for exactly: Hello, Python Village!\n#\n# Write a print() statement below that outputs exactly that text.\n\n`,
    check(stdout) {
      const lines = linesOf(stdout);
      if (lines.length === 0) {
        return "The terminal stayed silent — your code didn't print anything. Try calling print(...).";
      }
      if (!lines.some((l) => l === 'Hello, Python Village!')) {
        return `The terminal didn't recognise that greeting. It expected exactly: Hello, Python Village! (got: "${lines[0]}")`;
      }
      return null;
    },
    rewardXp: 20,
    rewardCoins: 3,
  },
  {
    id: 'w1-l2',
    title: 'The Status Board',
    topic: 'print() statement',
    story:
      'Py-Guide shows you the village status board — it needs two lines printed, in order, to light up. ' +
      'print() can be called as many times as you like; each call writes one more line.',
    starterCode: `# The status board needs two lines printed, in this exact order:\n#   Python Legends\n#   Level 2 online\n#\n# Call print() twice, once per line, below.\n\n`,
    predict: {
      prompt: 'Before you touch the board, predict what this snippet prints:',
      snippet: 'print("A")\nprint("B")',
      options: ['"A" then "B" on two separate lines', '"AB" on one line', 'Just "B" — the second print overwrites the first', 'A syntax error'],
      correctIndex: 0,
      explanation: 'Each print() call writes a whole new line — calling it twice always gives two lines of output, never one merged line.',
    },
    check(stdout) {
      const lines = linesOf(stdout);
      if (lines[0] !== 'Python Legends' || lines[1] !== 'Level 2 online') {
        return 'The status board expected exactly two lines: "Python Legends" then "Level 2 online".';
      }
      return null;
    },
    rewardXp: 20,
    rewardCoins: 3,
  },
  {
    id: 'w1-l3',
    title: "The Librarian's Riddle",
    topic: 'Comments and syntax',
    story:
      'The village librarian only trusts code that explains itself. A comment starts with # and is ' +
      'ignored by Python when the program runs — it is a note for humans, not the computer. Add a ' +
      'comment above your print() line explaining what it does, then print exactly: Comments make code readable',
    starterCode: W1_L3_STARTER,
    check(stdout, code) {
      // Don't just count comment lines against the starter: a student who
      // selects-all and rewrites from scratch (replacing the instructions
      // with their own comment, rather than keeping both) legitimately adds
      // an own comment but can end up with FEWER total comment lines than
      // the unmodified starter. Instead, look for at least one comment line
      // in the submitted code that isn't one of the starter's own
      // instructional lines.
      const starterCommentLines = new Set(
        W1_L3_STARTER.split('\n')
          .map((l) => l.trim())
          .filter((l) => l.startsWith('#'))
      );
      const hasOwnComment = code
        .split('\n')
        .map((l) => l.trim())
        .some((l) => l.startsWith('#') && l.length > 1 && !starterCommentLines.has(l));
      if (!hasOwnComment) {
        return 'The librarian wants to see your OWN comment (a line starting with #) explaining the code — the instructions above don\'t count as yours.';
      }
      const lines = linesOf(stdout);
      if (!lines.includes('Comments make code readable')) {
        return 'Your code should still print exactly: Comments make code readable';
      }
      return null;
    },
    rewardXp: 25,
    rewardCoins: 4,
  },
  {
    id: 'w1-l4',
    title: "The Guide's Nameplate",
    topic: 'Variables and identifiers',
    story:
      'A variable is a named box that stores a value. Create a variable called name holding the text ' +
      '"Explorer" and a variable called level holding the number 4, then print a single greeting line ' +
      'using an f-string: print(f"{name} reached level {level}")',
    starterCode:
      '# Create a variable called name holding the text "Explorer".\n' +
      '# Create a variable called level holding the number 4.\n' +
      '# Then print exactly one line, using an f-string:\n' +
      '#   Explorer reached level 4\n\n',
    check(stdout) {
      const lines = linesOf(stdout);
      if (!lines.includes('Explorer reached level 4')) {
        return 'Expected exactly: Explorer reached level 4 — check your variable names and the f-string.';
      }
      return null;
    },
    debugChallenge: {
      intro:
        'Bonus: Py-Guide left a nameplate generator running, but it crashes. A variable identifier has to ' +
        'match exactly everywhere you use it — find the mismatched name and fix it so the nameplate prints ' +
        'correctly.',
      buggyCode: `student_name = "Explorer"\n\nprint(f"Hello, {student_nam}!")\n`,
      hint: 'Compare the variable name where it’s created to the name used inside the f-string — one of them has a typo.',
      check(stdout) {
        const lines = linesOf(stdout);
        if (!lines.includes('Hello, Explorer!')) {
          return 'Expected exactly: Hello, Explorer! — the nameplate still isn’t printing the greeting correctly.';
        }
        return null;
      },
      rewardXp: 15,
      rewardCoins: 3,
    },
    rewardXp: 25,
    rewardCoins: 4,
  },
  {
    id: 'w1-l5',
    title: "The Shape-Shifter's Vault",
    topic: 'Data types',
    story:
      'The vault door is sealed with four locks, one per Python data type: a whole number (int), a ' +
      'decimal number (float), text (str), and a true/false value (bool). The type() function reveals ' +
      "a value's type. Print the type of each of the four given variables, in order, to open the vault.",
    starterCode:
      'int_val = 5\nfloat_val = 2.5\nstr_val = "hi"\nbool_val = True\n\n' +
      '# The vault has four locks — one per variable above.\n' +
      '# Print the type of each one, IN ORDER, using type():\n' +
      '#   type(int_val), type(float_val), type(str_val), type(bool_val)\n\n',
    predict: {
      prompt: 'Predict what type(5) prints, before you open the vault:',
      snippet: 'print(type(5))',
      options: ["<class 'int'>", '5', "<class 'number'>", "'int'"],
      correctIndex: 0,
      explanation: "type() always prints in the form <class '...'> — for a whole number like 5, that's <class 'int'>.",
    },
    check(stdout) {
      const lines = linesOf(stdout);
      const expected = ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'bool'>"];
      for (let i = 0; i < expected.length; i++) {
        if (lines[i] !== expected[i]) {
          return `Lock ${i + 1} didn't open. Expected ${expected[i]} on line ${i + 1} — make sure you print the four types in order.`;
        }
      }
      return null;
    },
    rewardXp: 25,
    rewardCoins: 4,
  },
  {
    id: 'w1-l6',
    title: "Py-Guide's Question",
    topic: 'input() statement',
    story:
      'Py-Guide wants to know your explorer name. Use input() to read it, then greet yourself by name: ' +
      'print(f"Hello, {name}! Welcome to Python Village.") — the terminal supplies the typed answer ' +
      'automatically, and will quietly test your code with a different name too.',
    starterCode:
      "# Read the explorer's name with input(), then print exactly:\n" +
      '#   Hello, <name>! Welcome to Python Village.\n' +
      '# using an f-string. The terminal will test your code with more than\n' +
      '# one name, so don’t hard-code "Explorer" — actually use input().\n\n',
    providedInputs: ['Explorer'],
    // Hidden case: a different name. A solution that hard-codes "Explorer"
    // instead of genuinely using input() will pass the visible case but
    // fail this one.
    hiddenTestCases: [{ providedInputs: ['Nova'], label: 'a different explorer name' }],
    check(stdout, _code, testCase) {
      const givenName = testCase.providedInputs?.[0] ?? 'Explorer';
      const lines = linesOf(stdout);
      if (!lines.includes(`Hello, ${givenName}! Welcome to Python Village.`)) {
        return testCase.label
          ? `When the terminal tried ${testCase.label}, the greeting was wrong — make sure your code uses whatever input() returns, not a fixed name.`
          : 'Expected exactly: Hello, Explorer! Welcome to Python Village. — check you used the value from input() directly.';
      }
      return null;
    },
    rewardXp: 30,
    rewardCoins: 5,
  },
  {
    id: 'w1-l7',
    title: 'The Converter Bridge',
    topic: 'Type conversion',
    story:
      'The bridge only crosses once a number has been converted correctly. input() always returns text ' +
      '(a str) — even when it looks like a number — so you must convert it with int() before doing math. ' +
      'Read a number with input(), convert it to an int, add 10, and print the result. The bridge will ' +
      'quietly test your code with a second number too.',
    starterCode:
      '# Read a number with input() — remember input() always returns TEXT.\n' +
      '# Convert it to a whole number with int(), add 10, then print the result.\n' +
      '# The bridge will test your code with more than one number, so make the\n' +
      '# conversion and addition work for any number, not just one.\n\n',
    providedInputs: ['15'],
    hiddenTestCases: [{ providedInputs: ['7'], label: 'a different number (not 15)' }],
    check(stdout, _code, testCase) {
      const given = Number(testCase.providedInputs?.[0] ?? '15');
      const expected = String(given + 10);
      const lines = linesOf(stdout);
      if (!lines.includes(expected)) {
        return testCase.label
          ? `When the bridge tried ${testCase.label}, it expected ${expected} — check your int() conversion and the addition work for any number, not just 15.`
          : 'Expected the bridge to print 25 (15 converted to a number, plus 10) — check your int() conversion and the addition.';
      }
      return null;
    },
    rewardXp: 30,
    rewardCoins: 5,
  },
];

export function getMission(missionId: string): Mission | undefined {
  return WORLD_1_MISSIONS.find((m) => m.id === missionId);
}
