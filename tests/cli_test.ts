import {
  assert,
  assertEquals,
  assertStringIncludes,
  delay,
  puppeteer,
  TextLineStream,
} from "./deps.ts";

type FileTree = {
  type: "file";
  name: string;
} | {
  type: "directory";
  name: string;
  contents: FileTree[];
} | {
  type: "report";
  directories: number;
  files: number;
};

const assertFileExistence = async (tree: FileTree[], dirname?: string) => {
  for (const t of tree) {
    if (t.type === "report") continue;

    const stat = await Deno.stat(
      dirname ? [dirname, t.name].join("/") : t.name,
    );
    assertEquals(t.type === "file", stat.isFile);

    if (t.type === "directory") {
      assert(stat.isDirectory);
      await assertFileExistence(
        t.contents,
        dirname ? [dirname, t.name].join("/") : t.name,
      );
    }
  }
};

Deno.test({
  name: "fresh-init",
  async fn(t) {
    // Preparation
    const tmpDirName = await Deno.makeTempDir();

    await t.step("execute init command", async () => {
      const cliProcess = Deno.run({
        cmd: ["deno", "run", "-A", "init.ts", tmpDirName, "--no-twind"],
        stdout: "null",
      });
      const { code } = await cliProcess.status();
      cliProcess.close();
      assertEquals(code, 0);
    });

    // NOTE: generated by `tree -J <dir>`
    const targetFileTree: FileTree[] = [
      {
        "type": "directory",
        "name": tmpDirName,
        "contents": [
          { "type": "file", "name": "README.md" },
          { "type": "file", "name": "import_map.json" },
          { "type": "file", "name": "fresh.gen.ts" },
          {
            "type": "directory",
            "name": "islands",
            "contents": [
              { "type": "file", "name": "Counter.tsx" },
            ],
          },
          { "type": "file", "name": "main.ts" },
          {
            "type": "directory",
            "name": "routes",
            "contents": [
              { "type": "file", "name": "[name].tsx" },
              {
                "type": "directory",
                "name": "api",
                "contents": [
                  { "type": "file", "name": "joke.ts" },
                ],
              },
              { "type": "file", "name": "index.tsx" },
            ],
          },
          {
            "type": "directory",
            "name": "static",
            "contents": [
              { "type": "file", "name": "logo.svg" },
            ],
          },
        ],
      },
      { "type": "report", "directories": 3, "files": 8 },
    ];

    await t.step("check generated files", async () => {
      await assertFileExistence(targetFileTree);
    });

    await t.step("start up the server and access the root page", async () => {
      const serverProcess = Deno.run({
        cmd: ["deno", "run", "-A", "--check", "main.ts"],
        stdout: "piped",
        stderr: "inherit",
        cwd: tmpDirName,
      });

      const lines = serverProcess.stdout.readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream());

      let started = false;
      for await (const line of lines) {
        console.log(line);
        if (line.includes("Server listening on http://")) {
          started = true;
          break;
        }
      }
      if (!started) {
        throw new Error("Server didn't start up");
      }

      await delay(100);

      // Access the root page
      const res = await fetch("http://localhost:8000");
      await res.body?.cancel();
      assertEquals(res.status, 200);

      // verify the island is revived.
      const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
      const page = await browser.newPage();
      await page.goto("http://localhost:8000", { waitUntil: "networkidle2" });
      const counter = await page.$("body > div > div > p");
      let counterValue = await counter?.evaluate((el) => el.textContent);
      assert(counterValue === "3");

      const buttonPlus = await page.$("body > div > div > button:nth-child(3)");
      await buttonPlus?.click();

      counterValue = await counter?.evaluate((el) => el.textContent);
      assert(counterValue === "4");
      await page.close();
      await browser.close();

      await lines.cancel();
      serverProcess.kill("SIGTERM");
      serverProcess.close();
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "fresh-init --twind",
  async fn(t) {
    // Preparation
    const tmpDirName = await Deno.makeTempDir();

    await t.step("execute init command", async () => {
      const cliProcess = Deno.run({
        cmd: ["deno", "run", "-A", "init.ts", tmpDirName, "--twind"],
        stdout: "null",
      });
      const { code } = await cliProcess.status();
      cliProcess.close();
      assertEquals(code, 0);
    });

    // NOTE: generated by `tree -J <dir>`
    const targetFileTree: FileTree[] = [
      {
        "type": "directory",
        "name": tmpDirName,
        "contents": [
          { "type": "file", "name": "README.md" },
          { "type": "file", "name": "import_map.json" },
          { "type": "file", "name": "fresh.gen.ts" },
          {
            "type": "directory",
            "name": "islands",
            "contents": [
              { "type": "file", "name": "Counter.tsx" },
            ],
          },
          { "type": "file", "name": "main.ts" },
          {
            "type": "directory",
            "name": "routes",
            "contents": [
              { "type": "file", "name": "[name].tsx" },
              {
                "type": "directory",
                "name": "api",
                "contents": [
                  { "type": "file", "name": "joke.ts" },
                ],
              },
              { "type": "file", "name": "index.tsx" },
            ],
          },
          {
            "type": "directory",
            "name": "static",
            "contents": [
              { "type": "file", "name": "logo.svg" },
            ],
          },
          {
            "type": "directory",
            "name": "utils",
            "contents": [
              { "type": "file", "name": "twind.ts" },
            ],
          },
        ],
      },
      { "type": "report", "directories": 4, "files": 9 },
    ];

    await t.step("check generated files", async () => {
      await assertFileExistence(targetFileTree);
    });

    await t.step("start up the server and access the root page", async () => {
      const serverProcess = Deno.run({
        cmd: ["deno", "run", "-A", "--check", "main.ts"],
        stdout: "piped",
        stderr: "inherit",
        cwd: tmpDirName,
      });

      const lines = serverProcess.stdout.readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream());

      let started = false;
      for await (const line of lines) {
        console.log(line);
        if (line.includes("Server listening on http://")) {
          started = true;
          break;
        }
      }
      if (!started) {
        throw new Error("Server didn't start up");
      }

      await delay(100);

      // Access the root page
      const res = await fetch("http://localhost:8000");
      await res.body?.cancel();
      assertEquals(res.status, 200);

      // verify the island is revived.
      const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
      const page = await browser.newPage();
      await page.goto("http://localhost:8000", { waitUntil: "networkidle2" });

      const counter = await page.$("body > div > div > p");
      let counterValue = await counter?.evaluate((el) => el.textContent);
      assert(counterValue === "3");

      const fontWeight = await counter?.evaluate((el) =>
        getComputedStyle(el).fontWeight
      );
      assertEquals(fontWeight, "700");

      const buttonPlus = await page.$("body > div > div > button:nth-child(3)");
      await buttonPlus?.click();

      counterValue = await counter?.evaluate((el) => el.textContent);
      assert(counterValue === "4");
      await page.close();
      await browser.close();

      await lines.cancel();
      serverProcess.kill("SIGTERM");
      serverProcess.close();
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test("fresh-init error(help)", async function (t) {
  const includeText = "fresh-init";

  await t.step(
    "execute invalid init command (deno run -A init.ts)",
    async () => {
      const cliProcess = Deno.run({
        cmd: ["deno", "run", "-A", "init.ts"],
        stderr: "piped",
      });
      const { code } = await cliProcess.status();
      cliProcess.close();
      assertEquals(code, 1);

      const rawError = await cliProcess.stderrOutput();
      const errorString = new TextDecoder().decode(rawError);

      assertStringIncludes(errorString, includeText);
    },
  );

  await t.step(
    "execute invalid init command (deno run -A init.ts -f)",
    async () => {
      const cliProcess = Deno.run({
        cmd: ["deno", "run", "-A", "init.ts", "-f"],
        stderr: "piped",
      });
      const { code } = await cliProcess.status();
      cliProcess.close();
      assertEquals(code, 1);

      const rawError = await cliProcess.stderrOutput();
      const errorString = new TextDecoder().decode(rawError);

      assertStringIncludes(errorString, includeText);
    },
  );

  await t.step(
    "execute invalid init command (deno run -A init.ts --foo)",
    async () => {
      const cliProcess = Deno.run({
        cmd: ["deno", "run", "-A", "init.ts", "--foo"],
        stderr: "piped",
      });
      const { code } = await cliProcess.status();
      cliProcess.close();
      assertEquals(code, 1);

      const rawError = await cliProcess.stderrOutput();
      const errorString = new TextDecoder().decode(rawError);

      assertStringIncludes(errorString, includeText);
    },
  );
});
