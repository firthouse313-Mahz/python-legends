export interface Mission {
  id: string;
  title: string;
  story: string;
  starterCode: string;
  /** Checks the program's captured stdout; returns a message on failure, or null on success. */
  check: (stdout: string) => string | null;
  rewardXp: number;
  rewardCoins: number;
}

export const MISSION_1: Mission = {
  id: 'intro-print',
  title: "Wake the Village Terminal",
  story:
    "The old village terminal has been asleep for years. Py-Guide says it only " +
    "wakes up for a real Python programmer. Use the print() function to say " +
    'hello and bring it back to life: print("Hello, Python Village!")',
  starterCode: `# Use print() to greet the village terminal.\n# It is listening for exactly: Hello, Python Village!\n\nprint("Hello, Python Village!")\n`,
  check(stdout: string) {
    const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean);
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
};
