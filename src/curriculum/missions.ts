// Real, checkable Python missions for World 1 (Python Village). Every
// mission here runs genuine student code through Pyodide — nothing is
// simulated or hard-coded — and `check()` inspects the program's actual
// captured stdout (and, where the topic itself is about source syntax
// rather than output, the submitted source too).
//
// This is deliberately just the "Code" step of the brief's full 9-step
// learning cycle (story -> learn -> explore -> code -> predict -> debug
// -> apply -> HOTS -> boss). The full cycle is explicitly Prompt 4's job;
// Prompt 2's job is the world/level system and a genuinely complete first
// world, which is what these seven missions are.

export interface Mission {
  id: string;
  title: string;
  topic: string;
  story: string;
  starterCode: string;
  /** Answers handed to input() calls, in order, for missions that use input(). */
  providedInputs?: string[];
  /**
   * Checks the program's run. `code` is the exact source the student
   * submitted — only used by missions whose topic is about syntax itself
   * (e.g. "did you write a comment"), not about output.
   */
  check: (stdout: string, code: string) => string | null;
  rewardXp: number;
  rewardCoins: number;
}

function linesOf(stdout: string): string[] {
  return stdout.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
}

export const WORLD_1_MISSIONS: Mission[] = [
  {
    id: 'w1-l1',
    title: 'Wake the Village Terminal',
    topic: 'Introduction to Python',
    story:
      'The old village terminal has been asleep for years. Py-Guide says it only wakes up for a real ' +
      'Python programmer. Every Python program starts with a single instruction to the computer. Use ' +
      'the print() function to say hello and bring the terminal back to life: print("Hello, Python Village!")',
    starterCode: `# Welcome to your very first Python program!\n# Use print() to greet the village terminal.\n# It is listening for exactly: Hello, Python Village!\n\nprint("Hello, Python Village!")\n`,
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
    starterCode: `# Call print() twice, once per line, to light up the status board.\n\nprint("Python Legends")\nprint("Level 2 online")\n`,
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
    starterCode: `# TODO: write your own comment on the line below explaining this print statement,\n# then make it print exactly: Comments make code readable\n\nprint("Comments make code readable")\n`,
    check(stdout, code) {
      const hasOwnComment = code.split('\n').some((l) => l.trim().startsWith('#') && !l.includes('TODO'));
      if (!hasOwnComment) {
        return 'The librarian wants to see your own comment (a line starting with #) explaining the code — the starter TODO note doesn\'t count.';
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
    starterCode: `name = "Explorer"\nlevel = 4\n\nprint(f"{name} reached level {level}")\n`,
    check(stdout) {
      const lines = linesOf(stdout);
      if (!lines.includes('Explorer reached level 4')) {
        return 'Expected exactly: Explorer reached level 4 — check your variable names and the f-string.';
      }
      return null;
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
      'print(type(int_val))\nprint(type(float_val))\nprint(type(str_val))\nprint(type(bool_val))\n',
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
      'print(f"Hello, {name}! Welcome to Python Village.") — for this mission, the terminal will supply ' +
      'the typed answer automatically.',
    starterCode: `name = input()\nprint(f"Hello, {name}! Welcome to Python Village.")\n`,
    providedInputs: ['Explorer'],
    check(stdout) {
      const lines = linesOf(stdout);
      if (!lines.includes('Hello, Explorer! Welcome to Python Village.')) {
        return 'Expected exactly: Hello, Explorer! Welcome to Python Village. — check you used the value from input() directly.';
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
      'Read a number with input(), convert it to an int, add 10, and print the result.',
    starterCode: `text = input()\nnumber = int(text)\nresult = number + 10\n\nprint(result)\n`,
    providedInputs: ['15'],
    check(stdout) {
      const lines = linesOf(stdout);
      if (!lines.includes('25')) {
        return 'Expected the bridge to print 25 (15 converted to a number, plus 10) — check your int() conversion and the addition.';
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
