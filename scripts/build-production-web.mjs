import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distIndex = join(rootDir, "packages", "webapp", "dist", "index.html");

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    env: { ...process.env, HUSKY: "0" },
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

if (!existsSync(join(rootDir, "node_modules"))) {
  console.error("Dependencies are missing. Install them before building.");
  process.exit(1);
}

for (const packageDir of [
  "shared/bigcapital-utils",
  "shared/pdf-templates",
  "shared/sdk-ts",
  "packages/webapp",
]) {
  run("npm", ["--prefix", packageDir, "run", "build"]);
}

if (!existsSync(distIndex) || statSync(distIndex).size === 0) {
  console.error("The web build did not produce a usable dist/index.html.");
  process.exit(1);
}

run("docker", ["compose", "-f", "docker-compose.prod.yml", "build", "webapp"]);
console.log(
  "Production web image built from the current, verified host bundle.",
);
