/**
 * decoder.js
 *
 * Converts a Hedera Transaction object into a human-readable string.
 * Used by sign.js to show the user what they are about to approve.
 *
 * Usage:
 *   const { describeTransaction } = require("./decoder");
 *   console.log(describeTransaction(info.scheduledTransaction));
 */

const {
  TransferTransaction,
  TokenMintTransaction,
  TokenBurnTransaction,
  TokenCreateTransaction,
  TokenDeleteTransaction,
  TokenUpdateTransaction,
  TokenAssociateTransaction,
  TokenDissociateTransaction,
  TokenWipeTransaction,
  TokenFreezeTransaction,
  TokenUnfreezeTransaction,
  TokenGrantKycTransaction,
  TokenRevokeKycTransaction,
  ContractExecuteTransaction,
  ContractCreateTransaction,
  AccountCreateTransaction,
  AccountUpdateTransaction,
  AccountDeleteTransaction,
  TopicCreateTransaction,
  TopicUpdateTransaction,
  TopicDeleteTransaction,
  TopicMessageSubmitTransaction,
  FileCreateTransaction,
  FileUpdateTransaction,
  FileDeleteTransaction,
  ScheduleDeleteTransaction,
} = require("@hashgraph/sdk");

// ─────────────────────────────────────────────────────────────────────────────

function hbarStr(tinybars) {
  const abs  = tinybars < 0n ? -tinybars : tinybars;
  const hbar = Number(abs) / 100_000_000;
  return `${hbar.toFixed(8)} ℏ`;
}

function describeTransaction(tx) {
  if (!tx) return "  (unable to read transaction details)";

  const lines = [];

  // ── TransferTransaction ───────────────────────────────────────────────────
  if (tx instanceof TransferTransaction) {
    lines.push("  Type : Transfer");

    const hbarTransfers = tx.hbarTransfers;
    if (hbarTransfers && hbarTransfers.size > 0) {
      lines.push("  HBAR:");
      for (const [accountId, amount] of hbarTransfers) {
        const tinybar = amount.toTinybars();
        const dir     = tinybar > 0n ? "  RECEIVES" : "  SENDS   ";
        lines.push(`   ${dir}  ${hbarStr(tinybar)}  → account ${accountId}`);
      }
    }

    const tokenTransfers = tx.tokenTransfers;
    if (tokenTransfers && tokenTransfers.size > 0) {
      lines.push("  Fungible tokens:");
      for (const [tokenId, accountMap] of tokenTransfers) {
        for (const [accountId, amount] of accountMap) {
          const dir = amount > 0n ? "  RECEIVES" : "  SENDS   ";
          lines.push(`   ${dir}  ${amount < 0n ? -amount : amount} units of ${tokenId}  → account ${accountId}`);
        }
      }
    }

    const nftTransfers = tx.nftTransfers;
    if (nftTransfers && nftTransfers.size > 0) {
      lines.push("  NFTs:");
      for (const [tokenId, transferList] of nftTransfers) {
        for (const nft of transferList) {
          lines.push(`    serial #${nft.serial}  of ${tokenId}  :  ${nft.senderAccountId} → ${nft.receiverAccountId}`);
        }
      }
    }

  // ── Token mint / burn ─────────────────────────────────────────────────────
  } else if (tx instanceof TokenMintTransaction) {
    lines.push("  Type : Token Mint");
    lines.push(`  Token  : ${tx.tokenId ?? "(not set)"}`);
    if (tx.amount != null) lines.push(`  Amount : ${tx.amount} units`);
    if (tx.metadata?.length) lines.push(`  NFT serials to mint : ${tx.metadata.length}`);

  } else if (tx instanceof TokenBurnTransaction) {
    lines.push("  Type : Token Burn");
    lines.push(`  Token  : ${tx.tokenId ?? "(not set)"}`);
    if (tx.amount != null) lines.push(`  Amount : ${tx.amount} units`);
    if (tx.serials?.length) lines.push(`  NFT serials : ${tx.serials.join(", ")}`);

  // ── Token lifecycle ───────────────────────────────────────────────────────
  } else if (tx instanceof TokenCreateTransaction) {
    lines.push("  Type : Token Create");
    lines.push(`  Name   : ${tx.tokenName ?? "(not set)"}`);
    lines.push(`  Symbol : ${tx.tokenSymbol ?? "(not set)"}`);
    if (tx.decimals != null) lines.push(`  Decimals : ${tx.decimals}`);

  } else if (tx instanceof TokenDeleteTransaction) {
    lines.push("  Type : Token Delete");
    lines.push(`  Token : ${tx.tokenId ?? "(not set)"}`);

  } else if (tx instanceof TokenUpdateTransaction) {
    lines.push("  Type : Token Update");
    lines.push(`  Token : ${tx.tokenId ?? "(not set)"}`);

  // ── Token account operations ──────────────────────────────────────────────
  } else if (tx instanceof TokenAssociateTransaction) {
    lines.push("  Type : Token Associate");
    lines.push(`  Account : ${tx.accountId ?? "(not set)"}`);
    lines.push(`  Tokens  : ${tx.tokenIds?.join(", ") ?? "(not set)"}`);

  } else if (tx instanceof TokenDissociateTransaction) {
    lines.push("  Type : Token Dissociate");
    lines.push(`  Account : ${tx.accountId ?? "(not set)"}`);
    lines.push(`  Tokens  : ${tx.tokenIds?.join(", ") ?? "(not set)"}`);

  } else if (tx instanceof TokenWipeTransaction) {
    lines.push("  Type : Token Wipe");
    lines.push(`  Token   : ${tx.tokenId ?? "(not set)"}`);
    lines.push(`  Account : ${tx.accountId ?? "(not set)"}`);
    if (tx.amount != null) lines.push(`  Amount  : ${tx.amount} units`);
    if (tx.serials?.length) lines.push(`  NFT serials : ${tx.serials.join(", ")}`);

  } else if (tx instanceof TokenFreezeTransaction) {
    lines.push("  Type : Token Freeze Account");
    lines.push(`  Token   : ${tx.tokenId ?? "(not set)"}`);
    lines.push(`  Account : ${tx.accountId ?? "(not set)"}`);

  } else if (tx instanceof TokenUnfreezeTransaction) {
    lines.push("  Type : Token Unfreeze Account");
    lines.push(`  Token   : ${tx.tokenId ?? "(not set)"}`);
    lines.push(`  Account : ${tx.accountId ?? "(not set)"}`);

  } else if (tx instanceof TokenGrantKycTransaction) {
    lines.push("  Type : Token Grant KYC");
    lines.push(`  Token   : ${tx.tokenId ?? "(not set)"}`);
    lines.push(`  Account : ${tx.accountId ?? "(not set)"}`);

  } else if (tx instanceof TokenRevokeKycTransaction) {
    lines.push("  Type : Token Revoke KYC");
    lines.push(`  Token   : ${tx.tokenId ?? "(not set)"}`);
    lines.push(`  Account : ${tx.accountId ?? "(not set)"}`);

  // ── Smart contract ────────────────────────────────────────────────────────
  } else if (tx instanceof ContractExecuteTransaction) {
    lines.push("  Type : Contract Call");
    lines.push(`  Contract : ${tx.contractId ?? "(not set)"}`);
    if (tx.gas != null) lines.push(`  Gas      : ${tx.gas}`);
    if (tx.payableAmount != null) {
      lines.push(`  Value    : ${hbarStr(tx.payableAmount.toTinybars())}`);
    }

  } else if (tx instanceof ContractCreateTransaction) {
    lines.push("  Type : Contract Create");
    if (tx.gas != null) lines.push(`  Gas : ${tx.gas}`);

  // ── Account operations ────────────────────────────────────────────────────
  } else if (tx instanceof AccountCreateTransaction) {
    lines.push("  Type : Account Create");
    if (tx.initialBalance != null) {
      lines.push(`  Initial balance : ${hbarStr(tx.initialBalance.toTinybars())}`);
    }

  } else if (tx instanceof AccountUpdateTransaction) {
    lines.push("  Type : Account Update");
    lines.push(`  Account : ${tx.accountId ?? "(not set)"}`);

  } else if (tx instanceof AccountDeleteTransaction) {
    lines.push("  Type : Account Delete");
    lines.push(`  Account               : ${tx.accountId ?? "(not set)"}`);
    lines.push(`  Transfer remainder to : ${tx.transferAccountId ?? "(not set)"}`);

  // ── Consensus topics ──────────────────────────────────────────────────────
  } else if (tx instanceof TopicCreateTransaction) {
    lines.push("  Type : Topic Create");
    if (tx.topicMemo) lines.push(`  Topic memo : "${tx.topicMemo}"`);

  } else if (tx instanceof TopicUpdateTransaction) {
    lines.push("  Type : Topic Update");
    lines.push(`  Topic : ${tx.topicId ?? "(not set)"}`);

  } else if (tx instanceof TopicDeleteTransaction) {
    lines.push("  Type : Topic Delete");
    lines.push(`  Topic : ${tx.topicId ?? "(not set)"}`);

  } else if (tx instanceof TopicMessageSubmitTransaction) {
    lines.push("  Type : Topic Message Submit");
    lines.push(`  Topic : ${tx.topicId ?? "(not set)"}`);

  // ── File service ──────────────────────────────────────────────────────────
  } else if (tx instanceof FileCreateTransaction) {
    lines.push("  Type : File Create");

  } else if (tx instanceof FileUpdateTransaction) {
    lines.push("  Type : File Update");
    lines.push(`  File : ${tx.fileId ?? "(not set)"}`);

  } else if (tx instanceof FileDeleteTransaction) {
    lines.push("  Type : File Delete");
    lines.push(`  File : ${tx.fileId ?? "(not set)"}`);

  // ── Schedule management ───────────────────────────────────────────────────
  } else if (tx instanceof ScheduleDeleteTransaction) {
    lines.push("  Type : Schedule Delete (cancel a pending schedule)");
    lines.push(`  Schedule : ${tx.scheduleId ?? "(not set)"}`);

  // ── Fallback ──────────────────────────────────────────────────────────────
  } else {
    const rawType  = tx.constructor?.name ?? "Unknown";
    const readable = rawType.replace(/Transaction$/, "").replace(/([A-Z])/g, " $1").trim();
    lines.push(`  Type : ${readable}`);
  }

  if (tx.transactionMemo) {
    lines.push(`  Memo : "${tx.transactionMemo}"`);
  }

  return lines.join("\n");
}

module.exports = { describeTransaction };
