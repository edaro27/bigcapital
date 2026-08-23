import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = join(rootDir, ".env.example");
const targetPath = join(rootDir, ".env");
const force = process.argv.includes("--force");
const enableSignup = process.argv.includes("--enable-signup");

if (existsSync(targetPath) && !force) {
  console.error(
    ".env already exists; refusing to overwrite it. Use --force intentionally.",
  );
  process.exit(1);
}

const replaceValue = (contents, name, value) => {
  const line = new RegExp(`^${name}=.*$`, "m");

  if (!line.test(contents)) {
    throw new Error(`Missing ${name} in .env.example`);
  }
  return contents.replace(line, `${name}=${value}`);
};

const secret = (bytes = 32) => randomBytes(bytes).toString("hex");
let contents = readFileSync(templatePath, "utf8");

for (const [name, value] of Object.entries({
  APP_JWT_SECRET: secret(48),
  DB_PASSWORD: secret(24),
  DB_ROOT_PASSWORD: secret(24),
  REDIS_PASSWORD: secret(32),
  BASE_URL: "http://127.0.0.1:8080",
  SIGNUP_DISABLED: enableSignup ? "false" : "true",
})) {
  contents = replaceValue(contents, name, value);
}

writeFileSync(targetPath, contents, { mode: 0o600, flag: "w" });
chmodSync(targetPath, 0o600);
console.log(`Created ${targetPath} with private, random local credentials.`);
if (enableSignup) {
  console.log("Local sign-up is enabled so you can create the first account.");
}
