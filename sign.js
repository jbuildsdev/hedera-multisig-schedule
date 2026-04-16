/**
 * Hedera Scheduled Multisig — Signer
 *
 * Add your signature to a scheduled transaction on the Hedera network.
 */

require("dotenv").config();
const readline = require("node:readline");
const {
  Client,
  PrivateKey,
  AccountId,
  ScheduleId,
  ScheduleSignTransaction,
  ScheduleInfoQuery,
} = require("@hashgraph/sdk");
const { describeTransaction } = require("./decoder");

// ── Validate environment ──────────────────────────────────────────────────────

function requireEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`${name} is not set in your .env file.`);
  return val;
}

// ── Y/N prompt ────────────────────────────────────────────────────────────────

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const myAccountId  = requireEnv("MY_ACCOUNT_ID");
  const myPrivateKey = requireEnv("MY_PRIVATE_KEY");
  const scheduleEnv  = requireEnv("SCHEDULE_ID");

  const network = (process.env.NETWORK ?? "testnet").trim().toLowerCase();
  if (network !== "testnet" && network !== "mainnet") {
    throw new Error(`NETWORK must be "testnet" or "mainnet" — got "${network}"`);
  }

  const privateKey = PrivateKey.fromStringECDSA(myPrivateKey);
  const accountId  = AccountId.fromString(myAccountId);
  const scheduleId = ScheduleId.fromString(scheduleEnv);

  const client = (network === "mainnet" ? Client.forMainnet() : Client.forTestnet())
    .setOperator(accountId, privateKey);

  try {
    console.log("\n============================================================");
    console.log("  Hedera Scheduled Multisig — Signer");
    console.log("============================================================\n");

    console.log(`  Network      : ${network}`);
    console.log(`  Schedule ID  : ${scheduleId}`);
    console.log(`  Your account : ${accountId}\n`);

    // ── Fetch current schedule state ─────────────────────────────────────────

    console.log("  Fetching schedule from network...\n");
    const info = await new ScheduleInfoQuery().setScheduleId(scheduleId).execute(client);

    // Already executed?
    if (info.executedAt != null) {
      console.log("  This schedule has already executed — nothing left to sign.");
      console.log(`  Executed at : ${info.executedAt}`);
      console.log("============================================================\n");
      return;
    }

    // Already deleted?
    if (info.deletedAt != null) {
      console.log("  This schedule was cancelled — nothing left to sign.");
      console.log("============================================================\n");
      return;
    }

    // ── Describe the transaction ──────────────────────────────────────────────

    const schedMemo = info.scheduleMemo ?? "";
    const payer     = info.payerAccountId ?? "(unknown)";
    const creator   = info.creatorAccountId ?? "(unknown)";
    const expires   = info.expirationTime ?? "(unknown)";

    console.log("  ── Transaction details ─────────────────────────────────");
    console.log(describeTransaction(info.scheduledTransaction));
    console.log("\n  ── Schedule details ────────────────────────────────────");
    if (schedMemo) console.log(`  Schedule memo  : "${schedMemo}"`);
    console.log(`  Fee payer      : ${payer}`);
    console.log(`  Created by     : ${creator}`);
    console.log(`  Expires        : ${expires}`);
    console.log(`\n  Hashscan : https://hashscan.io/${network}/schedule/${scheduleId}`);
    console.log("============================================================\n");

    // ── Confirm ───────────────────────────────────────────────────────────────

    const ok = await confirm("  Sign this transaction? (y/N)  ");
    if (!ok) {
      console.log("\n  Aborted — nothing was submitted.\n");
      return;
    }

    // ── Submit signature to the network ──────────────────────────────────────

    console.log("\n  Submitting your signature...\n");

    const tx = await new ScheduleSignTransaction()
      .setScheduleId(scheduleId)
      .freezeWith(client)
      .sign(privateKey);

    const response = await tx.execute(client);
    const receipt  = await response.getReceipt(client);

    console.log(`  Status : ${receipt.status}\n`);

    // ── Check if the threshold was just met ───────────────────────────────────

    const infoAfter = await new ScheduleInfoQuery().setScheduleId(scheduleId).execute(client);

    if (infoAfter.executedAt == null) {
      console.log(`  ✓ Signature recorded. Waiting for remaining signatures.`);
      console.log(`\n  Hashscan : https://hashscan.io/${network}/schedule/${scheduleId}`);
    } else {
      console.log("============================================================");
      console.log("  ✓ THRESHOLD MET — the transaction has been executed!");
      console.log("============================================================");
      console.log(`  Hashscan : https://hashscan.io/${network}/transaction/${receipt.scheduledTransactionId}`);
    }

    console.log("============================================================\n");
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error("\n  ERROR:", err.message ?? err);
  process.exit(1);
});
