// Diagnostic probe: exit 1 means a Node/native parity gap, not a passing gate.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compile, compileLibrary } from "../../../packages/compiler/src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const originalPack = process.env.SCRIPTC_RUNTIME_PACK;
if (!originalPack) throw new Error("Set SCRIPTC_RUNTIME_PACK to the existing ABI 48 pack to copy");
const temporary = mkdtempSync(join(tmpdir(), "scriptc-closed-records-"));
const call = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: "utf8" });
try {
  const pack = join(temporary, "runtime");
  cpSync(originalPack, pack, { recursive: true });
  const manifestPath = join(pack, "runtime-pack.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  // Keep vendor archives and other units. Rebuild both candidate JSON variants
  // from this checkout so a reused pack cannot conceal a reflection fix.
  for (const flavor of ["release", "library-release"]) {
    const unit = manifest.flavors[flavor].runtime_units.find((u: any) => u.source === "scr_json.c");
    for (const variant of unit.variants.filter((v: any) =>
      ["default", "dyn-tier"].includes(v.id),
    )) {
      const output = join(pack, variant.path);
      call("clang", [
        "-target",
        manifest.target.llvm_triple,
        "-std=c11",
        "-pthread",
        "-fno-math-errno",
        "-fno-strict-aliasing",
        "-Wno-deprecated-declarations",
        "-O2",
        ...variant.defines.map((d: string) => "-D" + d),
        "-I",
        join(root, "packages/runtime/src"),
        "-c",
        join(root, "packages/runtime/src/scr_json.c"),
        "-o",
        output,
      ]);
      variant.sha256 = createHash("sha256").update(readFileSync(output)).digest("hex");
      variant.size = statSync(output).size;
    }
  }
  writeFileSync(manifestPath, JSON.stringify(manifest));
  process.env.SCRIPTC_RUNTIME_PACK = pack;
  process.env.SCRIPTC_CACHE_DIR = join(temporary, "cache");
  process.env.SCRIPTC_CHECKER_SERVER = "0";
  process.env.CMAKE_BUILD_PARALLEL_LEVEL = "2";
  process.env.SCRIPTC_TEST_WORKERS = "2";
  const executable = join(temporary, "executable");
  const built = await compile(join(here, "main.ts"), {
    outDir: join(temporary, "exe"),
    outPath: executable,
    optimization: "release",
  });
  if (!built.ok) throw new Error(JSON.stringify(built.diagnostics));
  const archive = join(temporary, "probe.lib.a");
  const library = await compileLibrary({
    profilePath: join(here, "profile.json"),
    outDir: join(temporary, "lib"),
    outPath: archive,
  });
  if (!library.ok) throw new Error(JSON.stringify(library.diagnostics));
  const host = join(temporary, "host");
  call("clang", ["-O2", join(here, "host.c"), archive, "-o", host]);
  const node = call(process.execPath, [join(here, "main.ts")]);
  const native = call(executable, []);
  const nativeLibrary = call(host, []);
  const parity = node === native && node === nativeLibrary;
  console.log(
    JSON.stringify(
      {
        nodeVersion: process.version,
        base: call("git", ["-C", root, "rev-parse", "HEAD"]).trim(),
        platform: process.platform,
        arch: process.arch,
        runtime:
          "reused ABI 48 pack; release and library-release default/dyn-tier scr_json.c rebuilt from source",
        node,
        native,
        nativeLibrary,
        parity,
      },
      null,
      2,
    ),
  );
  process.exitCode = parity ? 0 : 1;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
