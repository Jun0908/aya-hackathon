// src/index.ts
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ethers } from 'ethers';
// ✅ Vault の ABI を読み込み
import abiJson from '../abi/SimpleVault.abi.json' with { type: 'json' };
const ABI = abiJson;
const iface = new ethers.Interface(ABI);
// 必須 env
function need(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Environment variable ${name} is required`);
    return v;
}
const server = new McpServer({ name: 'simple-vault', version: '1.0.0' });
/** 共通：Vault コントラクト生成 */
function getContract(signer) {
    const rpc = need('https://testnet.hashio.io/api');
    const addr = need('0x1440a247071edde7e1016b18126163d805f98c31');
    const provider = new ethers.JsonRpcProvider(rpc);
    const runner = signer ?? provider;
    return {
        provider,
        contract: new ethers.Contract(addr, ABI, runner),
    };
}
/** A) deposit: トークンを Vault に預け入れ */
server.registerTool('vault_deposit', {
    title: 'Deposit tokens into Vault',
    description: 'Calls deposit(amount) after approve.',
    inputSchema: {
        amount: z.string().describe('Amount of tokens (in wei, as string)'),
    },
}, async ({ amount }) => {
    const rpc = need('https://testnet.hashio.io/api');
    const pk = need('WALLET_PRIVATE_KEY');
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const { contract } = getContract(wallet);
    // deposit 実行
    const tx = await contract.deposit(BigInt(amount));
    const receipt = await tx.wait();
    return {
        content: [
            {
                type: 'text',
                text: `✅ Deposited\n` +
                    `amount: ${amount}\n` +
                    `txHash: ${receipt?.hash ?? tx.hash}\n`,
            },
        ],
    };
});
/** B) withdraw: Vault から引き出す */
server.registerTool('vault_withdraw', {
    title: 'Withdraw tokens from Vault',
    description: 'Calls withdraw(amount).',
    inputSchema: {
        amount: z.string().describe('Amount of tokens (in wei, as string)'),
    },
}, async ({ amount }) => {
    const rpc = need('https://testnet.hashio.io/api');
    const pk = need('WALLET_PRIVATE_KEY');
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const { contract } = getContract(wallet);
    const tx = await contract.withdraw(BigInt(amount));
    const receipt = await tx.wait();
    return {
        content: [
            {
                type: 'text',
                text: `✅ Withdrawn\n` +
                    `amount: ${amount}\n` +
                    `txHash: ${receipt?.hash ?? tx.hash}\n`,
            },
        ],
    };
});
/** C) 残高確認: balances(address) を読む */
server.registerTool('vault_balance', {
    title: 'Check balance in Vault',
    description: 'Reads balances(user).',
    inputSchema: {
        user: z.string().describe('0x-address of user'),
    },
}, async ({ user }) => {
    const { contract } = getContract();
    const bal = await contract.balances(user);
    return {
        content: [
            {
                type: 'text',
                text: `💰 Vault balance of ${user}\n` +
                    `${bal.toString()} (wei)\n`,
            },
        ],
    };
});
await server.connect(new StdioServerTransport());
