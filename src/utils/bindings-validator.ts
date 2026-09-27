import fs from "fs";
import path from "path";

export interface BindingsValidationResult {
  ok: boolean;
  errors: string[];
  info: {
    vendorPath: string;
    esmEntry: string | null;
    cjsEntry: string | null;
    packageName: string | null;
    commitSha: string | null;
  };
}

const BINDINGS_PACKAGE_NAME = "@tevalabs/xelma-bindings";

export function getVendorBindingsRoot(cwd: string = process.cwd()): string {
  return path.resolve(cwd, "vendor", "xelma-bindings");
}

/**
 * Verify that the vendored @tevalabs/xelma-bindings package is present and
 * well-formed. install-bindings.js writes ESM + CJS dist outputs and a
 * .commit-sha marker file; this check confirms each artifact exists and
 * surfaces the recorded upstream SHA so operators can spot a stale vendor.
 *
 * Returns a structured result rather than throwing — startup callers decide
 * whether a missing vendor is fatal (Soroban-required deployments) or just
 * worth logging (API-only deployments).
 */
export async function validateVendoredBindings(
  cwd: string = process.cwd(),
): Promise<BindingsValidationResult> {
  const vendorPath = getVendorBindingsRoot(cwd);
  const esmEntryPath = path.join(vendorPath, "dist", "index.js");
  const cjsEntryPath = path.join(vendorPath, "dist", "cjs", "index.js");
  const packageJsonPath = path.join(vendorPath, "package.json");
  const commitShaPath = path.join(vendorPath, ".commit-sha");
  const metadataPath = path.join(cwd, ".bindings-metadata.json");

  const errors: string[] = [];
  let packageName: string | null = null;
  let commitSha: string | null = null;

  let expectedCommitSha: string | null = null;
  let requiredExports: string[] = [];

  if (fs.existsSync(metadataPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      expectedCommitSha = meta.expectedCommitSha || null;
      requiredExports = Array.isArray(meta.requiredExports) ? meta.requiredExports : [];
    } catch (e) {
      errors.push(`metadata file is not valid JSON: ${(e as Error).message}`);
    }
  } else {
    errors.push(`metadata file missing: ${metadataPath}`);
  }

  if (!fs.existsSync(vendorPath)) {
    errors.push(
      `vendor/xelma-bindings missing at ${vendorPath}. ` +
        "Run `npm run install-bindings` to fetch and build the bindings.",
    );
  } else {
    if (!fs.existsSync(esmEntryPath)) {
      errors.push(`ESM entry missing: ${esmEntryPath}`);
    }
    if (!fs.existsSync(cjsEntryPath)) {
      errors.push(`CJS entry missing: ${cjsEntryPath}`);
    }
    if (!fs.existsSync(packageJsonPath)) {
      errors.push(`package.json missing: ${packageJsonPath}`);
    } else {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        packageName = typeof pkg?.name === "string" ? pkg.name : null;
        if (packageName !== BINDINGS_PACKAGE_NAME) {
          errors.push(
            `vendor package.json name is ${JSON.stringify(packageName)}, expected ${BINDINGS_PACKAGE_NAME}`,
          );
        }
      } catch (e) {
        errors.push(`vendor package.json is not valid JSON: ${(e as Error).message}`);
      }
    }
    if (fs.existsSync(commitShaPath)) {
      try {
        commitSha = fs.readFileSync(commitShaPath, "utf8").trim() || null;
      } catch {
        commitSha = null;
      }
    }
    
    if (commitSha && expectedCommitSha && commitSha !== expectedCommitSha) {
      errors.push(`bindings commit SHA mismatch: expected ${expectedCommitSha}, got ${commitSha}`);
    }

    if (errors.length === 0 && requiredExports.length > 0) {
      try {
        // Use relative path to avoid node_modules resolution issues
        const { Client } = await import(esmEntryPath);
        if (!Client) {
          errors.push("vendor package does not export a Client class");
        } else {
          // Initialize dummy client to inspect surface
          const clientInstance = new Client({
            contractId: "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            networkPassphrase: "Test",
            rpcUrl: "http://localhost:8000"
          });
          
          for (const reqExport of requiredExports) {
            if (typeof clientInstance[reqExport] !== "function") {
              errors.push(`Client surface is missing required method: ${reqExport}`);
            }
          }
        }
      } catch (e) {
        errors.push(`Failed to inspect bindings Client: ${(e as Error).message}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    info: {
      vendorPath,
      esmEntry: fs.existsSync(esmEntryPath) ? esmEntryPath : null,
      cjsEntry: fs.existsSync(cjsEntryPath) ? cjsEntryPath : null,
      packageName,
      commitSha,
    },
  };
}
