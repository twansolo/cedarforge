/**
 * Generates the ADMIN_PASSWORD_HASH value.
 *
 *   npm run admin:hash
 *
 * The password is read from a hidden prompt rather than an argument, so it does
 * not end up in shell history or the process list. Only the resulting hash is
 * printed; it is safe to paste into Vercel or .env.local, and the plain password
 * is never written anywhere.
 */

import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const PARAMS = { N: 32768, r: 8, p: 1, keyLength: 64 };

/** Reads every line of piped stdin, for non-interactive use. */
async function readPipedLines() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
}

/**
 * Hidden terminal prompt.
 *
 * The prompt string is written before muting, so the label is visible while the
 * typed characters are not. Nothing is echoed at all, not even asterisks, which
 * keeps the length off the screen.
 */
function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    let muted = false;
    rl._writeToOutput = (chunk) => {
      if (!muted) rl.output.write(chunk);
    };

    rl.question(question, (answer) => {
      muted = false;
      rl.output.write("\n");
      rl.close();
      resolve(answer);
    });

    // `question` emits the prompt synchronously above, so muting here hides
    // only the keystrokes that follow.
    muted = true;

    rl.on("SIGINT", () => {
      rl.close();
      reject(new Error("\nCancelled."));
    });
  });
}

async function hashPassword(password) {
  const { N, r, p, keyLength } = PARAMS;
  const salt = randomBytes(16);

  const derived = await scryptAsync(password.normalize("NFKC"), salt, keyLength, {
    N,
    r,
    p,
    maxmem: 256 * N * r,
  });

  // ":" rather than "$": Next expands $NAME inside .env files, which would
  // quietly corrupt a $-delimited hash. Kept in sync with src/lib/admin/password.ts.
  return [
    "scrypt",
    N,
    r,
    p,
    keyLength,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join(":");
}

function checkStrength(password) {
  const problems = [];
  if (password.length < 16) problems.push("use at least 16 characters");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    problems.push("mix upper and lower case");
  }
  if (!/\d/.test(password)) problems.push("include a digit");
  if (!/[^\w\s]/.test(password)) problems.push("include a symbol");
  return problems;
}

async function main() {
  console.log("\nCedar Forge — admin password hash\n");

  let password;
  let confirmation;

  if (process.stdin.isTTY) {
    password = await promptHidden("Password: ");
    confirmation = await promptHidden("Confirm password: ");
  } else {
    // Piped input: first line is the password, an optional second line confirms.
    const [first = "", second] = await readPipedLines();
    password = first;
    confirmation = second === undefined || second === "" ? first : second;
  }

  if (!password) {
    console.error("No password entered. Nothing generated.");
    process.exitCode = 1;
    return;
  }

  if (password !== confirmation) {
    console.error("Those did not match. Nothing generated.");
    process.exitCode = 1;
    return;
  }

  const problems = checkStrength(password);
  if (problems.length > 0) {
    console.warn(`\nWeak password. Consider: ${problems.join(", ")}.`);
    console.warn(
      "This is the only credential protecting the admin area. A long passphrase from a password manager is the right choice.\n",
    );
  }

  const hash = await hashPassword(password);
  const secret = randomBytes(32).toString("base64");

  console.log("Add these to .env.local for development, and to your hosting");
  console.log("provider's environment variables for production:\n");
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`ADMIN_SESSION_SECRET=${secret}\n`);
  console.log(
    "Keep the existing ADMIN_SESSION_SECRET if you already have one — replacing\n" +
      "it signs every operator out. Changing ADMIN_PASSWORD_HASH also signs out\n" +
      "existing sessions, which is how you revoke access remotely.\n",
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
