import { createHash } from "node:crypto";
import {
  chmodSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { createGunzip, createGzip } from "node:zlib";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const backupDir = join(rootDir, "backups", "production");
const projects = {
  dev: {
    name: "bigcapital-dev-infrastructure",
    composeFile: "docker-compose.yml",
  },
  prod: { name: "bigcapital-local", composeFile: "docker-compose.prod.yml" },
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) {
    const detail = options.capture ? `\n${result.stderr || result.stdout}` : "";
    throw new Error(`${command} ${args.join(" ")} failed${detail}`);
  }
  return options.capture ? result.stdout.trim() : "";
};

const docker = (args, options) => run("docker", args, options);
const compose = (project, args, options) =>
  docker(["compose", "-f", project.composeFile, ...args], options);

const containerIds = (project, onlyRunning = false) => {
  const args = ["ps"];
  if (!onlyRunning) args.push("-a");
  args.push(
    "--filter",
    `label=com.docker.compose.project=${project.name}`,
    "--format",
    "{{.ID}}",
  );
  const output = docker(args, { capture: true });
  return output ? output.split("\n").filter(Boolean) : [];
};

const inspectState = (containerId) => {
  const output = docker(
    ["inspect", "--format", "{{.State.Status}}|{{.State.Paused}}", containerId],
    { capture: true },
  );
  const [status, paused] = output.split("|");
  return { status, paused: paused === "true" };
};

const pauseProject = (project) => {
  const ids = containerIds(project, true).filter(
    (containerId) => !inspectState(containerId).paused,
  );
  if (ids.length) docker(["pause", ...ids]);
};

const unpauseProject = (project) => {
  const ids = containerIds(project, true).filter(
    (containerId) => inspectState(containerId).paused,
  );
  if (ids.length) docker(["unpause", ...ids]);
};

const startEnvironment = (target) => {
  const other = target === "dev" ? "prod" : "dev";
  pauseProject(projects[other]);
  unpauseProject(projects[target]);
  compose(projects[target], ["up", "-d"]);
  console.log(
    `${target === "dev" ? "Development" : "Production"} is running; the other environment is paused.`,
  );
};

const pauseAll = () => {
  pauseProject(projects.dev);
  pauseProject(projects.prod);
  console.log("All running BigCapital Docker containers are paused.");
};

const showStatus = () => {
  for (const [label, project] of Object.entries(projects)) {
    console.log(`\n${label.toUpperCase()}`);
    compose(
      project,
      ["ps", "-a", "--format", "table {{.Service}}\t{{.Status}}"],
      { allowFailure: true },
    );
  }
};

const findProdMysql = () => {
  const id = compose(projects.prod, ["ps", "-a", "-q", "mysql"], {
    capture: true,
  });
  if (!id) throw new Error("The production database container does not exist.");
  return id;
};

const ensureProdMysqlRunning = () => {
  pauseProject(projects.dev);
  let containerId = compose(projects.prod, ["ps", "-a", "-q", "mysql"], {
    capture: true,
  });
  const initial = containerId
    ? inspectState(containerId)
    : { status: "missing", paused: false };

  if (initial.status === "missing" || initial.status === "exited") {
    compose(projects.prod, ["up", "-d", "mysql"]);
    containerId = findProdMysql();
  } else if (initial.paused) {
    docker(["unpause", containerId]);
  }

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ready = docker(
      [
        "exec",
        containerId,
        "sh",
        "-ec",
        'mariadb-admin ping --silent --user=root --password="$MYSQL_ROOT_PASSWORD"',
      ],
      { allowFailure: true, capture: true },
    );
    if (ready) return { containerId, initial };
    run("sleep", ["1"]);
  }
  throw new Error("The production database did not become ready.");
};

const restoreProdMysqlState = ({ containerId, initial }) => {
  if (initial.status === "missing" || initial.status === "exited") {
    compose(projects.prod, ["stop", "mysql"]);
  } else if (initial.paused) {
    docker(["pause", containerId]);
  }
};

const streamChild = (command, args, stdout) =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "inherit"],
    });
    child.stdout.pipe(stdout, { end: false });
    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${command} failed with exit code ${code}`));
    });
  });

const databaseNames = (containerId) => {
  const output = docker(
    [
      "exec",
      containerId,
      "sh",
      "-ec",
      'mariadb --batch --skip-column-names --user=root --password="$MYSQL_ROOT_PASSWORD" -e "SHOW DATABASES"',
    ],
    { capture: true },
  );
  const excluded = new Set([
    "information_schema",
    "mysql",
    "performance_schema",
    "sys",
  ]);
  return output.split("\n").filter((name) => name && !excluded.has(name));
};

const newestBackup = () => {
  if (!existsSync(backupDir))
    throw new Error("No production backup exists yet.");
  const files = readdirSync(backupDir)
    .filter((name) => name.endsWith(".sql.gz"))
    .sort();
  if (!files.length) throw new Error("No production backup exists yet.");
  return join(backupDir, files.at(-1));
};

const backupProduction = async () => {
  mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  const database = ensureProdMysqlRunning();
  const stamp = new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-");
  const backupPath = join(backupDir, `bigcapital-production-${stamp}.sql.gz`);
  const names = databaseNames(database.containerId);
  if (!names.length) throw new Error("No BigCapital databases were found.");

  const gzip = createGzip({ level: 9 });
  const output = createWriteStream(backupPath, { mode: 0o600, flags: "wx" });
  const writing = pipeline(gzip, output);

  try {
    await streamChild(
      "docker",
      [
        "exec",
        database.containerId,
        "sh",
        "-ec",
        'exec mariadb-dump --single-transaction --routines --events --triggers --hex-blob --user=root --password="$MYSQL_ROOT_PASSWORD" --databases "$@"',
        "bigcapital-backup",
        ...names,
      ],
      gzip,
    );
    gzip.end();
    await writing;
    chmodSync(backupPath, 0o600);

    const hash = createHash("sha256");
    await pipeline(createReadStream(backupPath), hash);
    console.log(`Backup created: ${backupPath}`);
    console.log(`SHA-256: ${hash.digest("hex")}`);
    return backupPath;
  } finally {
    restoreProdMysqlState(database);
  }
};

const verifyBackup = async (requestedPath) => {
  const backupPath = requestedPath
    ? resolve(rootDir, requestedPath)
    : newestBackup();
  if (!existsSync(backupPath))
    throw new Error(`Backup not found: ${backupPath}`);

  const suffix = `${process.pid}-${Date.now()}`;
  const containerName = `bigcapital-backup-verify-${suffix}`;
  const volumeName = `bigcapital_backup_verify_${suffix}`;
  const prodMysql = findProdMysql();
  const image = docker(
    ["inspect", "--format", "{{.Config.Image}}", prodMysql],
    { capture: true },
  );

  docker(["volume", "create", volumeName], { capture: true });
  try {
    docker(
      [
        "run",
        "-d",
        "--name",
        containerName,
      "-e",
      "MYSQL_ROOT_PASSWORD=backup-restore-verification",
      "-e",
      "MYSQL_DATABASE=bigcapital_verify_system",
      "-e",
      "MYSQL_USER=bigcapital_verify",
      "-e",
      "MYSQL_PASSWORD=backuprestoreverification",
      "-e",
      "TENANT_DB_NAME_PERFIX=bigcapital_verify_tenant_",
      "-v",
        `${volumeName}:/var/lib/mysql`,
        image,
      ],
      { capture: true },
    );

    let ready = false;
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const ping = docker(
        [
          "exec",
          containerName,
          "mariadb-admin",
          "ping",
          "--silent",
          "--user=root",
          "--password=backup-restore-verification",
        ],
        { allowFailure: true, capture: true },
      );
      if (ping) {
        ready = true;
        break;
      }
      run("sleep", ["1"]);
    }
    if (!ready) {
      const logs = docker(["logs", "--tail", "80", containerName], {
        allowFailure: true,
        capture: true,
      });
      throw new Error(
        `Temporary restore database did not become ready.\n${logs}`,
      );
    }

    const restore = spawn(
      "docker",
      [
        "exec",
        "-i",
        containerName,
        "mariadb",
        "--user=root",
        "--password=backup-restore-verification",
      ],
      { cwd: rootDir, stdio: ["pipe", "inherit", "inherit"] },
    );
    const input = createReadStream(backupPath).pipe(createGunzip());
    input.pipe(restore.stdin);
    await new Promise((resolvePromise, rejectPromise) => {
      input.on("error", rejectPromise);
      restore.on("error", rejectPromise);
      restore.on("close", (code) =>
        code === 0
          ? resolvePromise()
          : rejectPromise(new Error(`Restore failed with exit code ${code}`)),
      );
    });

    const restored = docker(
      [
        "exec",
        containerName,
        "mariadb",
        "--batch",
        "--skip-column-names",
        "--user=root",
        "--password=backup-restore-verification",
        "-e",
        "SHOW DATABASES LIKE 'bigcapital%';",
      ],
      { capture: true },
    );
    if (!restored)
      throw new Error("Restore completed but no BigCapital database exists.");
    console.log(`Backup restore verified successfully: ${backupPath}`);
    console.log(`Restored databases:\n${restored}`);
  } finally {
    docker(["rm", "-f", containerName], { allowFailure: true, capture: true });
    docker(["volume", "rm", volumeName], { allowFailure: true, capture: true });
  }
};

const command = process.argv[2];

try {
  if (command === "start-dev") startEnvironment("dev");
  else if (command === "start-prod") startEnvironment("prod");
  else if (command === "pause-all") pauseAll();
  else if (command === "status") showStatus();
  else if (command === "backup-prod") await backupProduction();
  else if (command === "verify-backup") await verifyBackup(process.argv[3]);
  else {
    console.error(
      "Usage: node scripts/bigcapital-ops.mjs <start-dev|start-prod|pause-all|status|backup-prod|verify-backup>",
    );
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
