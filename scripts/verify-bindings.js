// Verify vendored bindings against metadata without starting the whole server
const { validateVendoredBindings } = require("../dist/utils/bindings-validator.js");

async function main() {
  const result = await validateVendoredBindings();
  if (!result.ok) {
    console.error("Bindings validation failed:", result.errors);
    process.exit(1);
  }
  console.log("Bindings validation passed.");
}

main().catch(e => {
  console.error("Bindings validation error:", e);
  process.exit(1);
});
