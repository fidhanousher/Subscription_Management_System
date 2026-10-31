import "dotenv/config";
import { runBilling } from "../lib/billing";

async function main() {
  const result = await runBilling();
  console.log("Billing run", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
