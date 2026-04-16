# Hedera Schedule Signer

Add your signature to a pending scheduled transaction on the Hedera network.

Someone has created a scheduled transaction and shared a **Schedule ID** with you (looks like `0.0.123456`). Once enough signers have approved it, the transaction executes automatically on-chain.

---

## Setup

**1. Get a Hedera account**

You need an account on the same network (testnet or mainnet) as the schedule.

**2. Clone and install**

```bash
git clone <this-repo>
cd hedera-schedule-signer
npm install
```

**3. Create your `.env` file**

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
NETWORK=testnet           ← change to mainnet if needed
MY_ACCOUNT_ID=0.0.XXXXXX
MY_PRIVATE_KEY=your-private-key-here
SCHEDULE_ID=0.0.XXXXXX   ← the ID you were given
```

---

## Sign

```bash
node sign.js
```

The script will:
1. Fetch the scheduled transaction from the network
2. Show you what it does in plain language
3. Ask **y/N** before doing anything
4. Submit your signature
5. Confirm whether the threshold was met and the transaction executed

---

