import "dotenv/config";
import cron from "node-cron";
import { runBilling } from "../lib/billing";

console.log("Brightloop billing worker started (every hour).");

cron.schedule("0 * * * *", async () => {
  const result = await runBilling();
  console.log(new Date().toISOString(), "Billing run", result);
});
