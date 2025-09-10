# Aya Hackathon — ERC‑8004 × MCP × ElizaOS

A minimal end‑to‑end template that makes **AI agent outputs verifiable on‑chain**.

* **ERC‑8004 contracts** record *who produced* (Identity), *who can give feedback* (Reputation), and *who validated with what score* (Validation).
* A lightweight **MCP server (Node/TypeScript)** exposes tools to call these contracts from any MCP‑capable agent (e.g., ElizaOS).
* **ElizaOS** uses natural language to trigger MCP tools (e.g., “Validate this report”), anchoring results on chain.

---

## ✨ Features

* Identity → register agent (domain/address ↔ agentId)
* Reputation → server authorizes client feedback (no self‑feedback)
* Validation → server → validator request + score (0–100) with expiry & double‑response protection
* MCP tools: `register_agent`, `authorize_feedback`, `request_validation`, `submit_validation_response`, `resolve_*`, `get_validation_response`

---

## 🧱 Architecture (high level)

```
ElizaOS (chat) ──natural language──▶ MCP client ──stdio JSON‑RPC──▶ **MCP server**
                                                           │
                                                           ▼
                                                ethers v6 / RPC (Sepolia)
                                                           │
                                                           ▼
                                        **ERC‑8004** Identity / Reputation / Validation
```

---

## 🚀 Quickstart

### 1) Prerequisites

* Node.js **>= 20**
* `npm` (or `pnpm`/`yarn`)
* An RPC URL for **Ethereum Sepolia** (e.g., Infura/Alchemy)
* 3 funded test keys (Analyst / Validator / Client) or use local Anvil
* (Optional) Remix or Foundry if you want to redeploy the contracts

### 2) Contracts

You can use the provided ABIs + deployed addresses (fill in your own):

```env
# .env (root or mcp-server/)
RPC_URL=https://sepolia.infura.io/v3/<YOUR_KEY>
PRIVATE_KEY_ANALYST=0x...
PRIVATE_KEY_VALIDATOR=0x...
PRIVATE_KEY_CLIENT=0x...
# Deployed addresses
IDENTITY_REGISTRY=0x...
REPUTATION_REGISTRY=0x...
VALIDATION_REGISTRY=0x...
DEFAULT_WALLET=VALIDATOR
```

If you need to deploy yourself (Remix):

1. Deploy `IdentityRegistry` (no constructor args)
2. Deploy `ReputationRegistry(identityRegistryAddress)`
3. Deploy `ValidationRegistry(identityRegistryAddress)`

### 3) MCP server

```bash
cd mcp-server
npm i
npm run build
node dist/index.js
```

The server speaks **MCP over stdio** and exposes the tools listed above.

### 4) ElizaOS integration

Add the MCP server to your character settings:

```ts
// eliza-os/character.ts (excerpt)
export const character = {
  ...,
  settings: {
    mcp: {
      servers: {
        erc8004: {
          type: 'stdio',
          command: 'node',
          args: ['<ABSOLUTE_PATH>/mcp-server/dist/index.js'],
          cwd: '<ABSOLUTE_PATH>/mcp-server',
        },
      },
    },
  },
};
```

Then run ElizaOS and talk to it:

> “**Register me** as an agent with domain `myagent.eth`”  → `register_agent`
>
> “**Validate this report**” (Eliza will hash the content, call `request_validation`, then later fetch with `get_validation_response`).

---

## 🧪 Demo Flow (happy path)

1. **Analyst** generates a report → hashes the JSON (`sha256`) → calls `request_validation` with the digest + validatorId.
2. **Validator** reviews and submits `submit_validation_response(dataHash, score)`.
3. Anyone can call `get_validation_response(dataHash)` to read the score and status.

This gives you: *who wrote it*, *who authorized feedback*, *who validated with what score* — all anchored on chain.

---

## 🛠️ Tech Stack

* Solidity 0.8.x (ERC‑8004: Identity / Reputation / Validation)
* Node.js + TypeScript (MCP server, Ajv, dotenv)
* ethers v6 (contract calls)
* ElizaOS (MCP client)
* (Optional) Comput3 policy language for tool guardrails

---

## 📁 Repository structure (suggested)

```
aya-hackathon/
├─ eliza-os/
│  └─ character.ts
├─ mcp-server/
│  ├─ src/
│  │  ├─ index.ts          # MCP entry
│  │  ├─ mcp.ts            # stdio JSON-RPC wiring
│  │  ├─ erc8004.ts        # ethers bindings
│  │  └─ schemas.ts        # Ajv JSON Schemas
│  ├─ abi/
│  │  ├─ IdentityRegistry.json
│  │  ├─ ReputationRegistry.json
│  │  └─ ValidationRegistry.json
│  └─ .env.example
└─ README.md
```

---

## 🔒 Notes & Gotchas

* Make sure your **private keys are funded** on Sepolia.
* The Validation request has an **expiration window**; expired requests must be re‑created.
* Self‑feedback and self‑validation are **rejected** at the contract level.

---

## 📜 License

MIT
