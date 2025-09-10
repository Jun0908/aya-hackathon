import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { JsonRpcProvider, Wallet, Contract } from 'ethers';
dotenv.config();
function loadAbi(abiPath) {
    const raw = fs.readFileSync(path.resolve(abiPath), 'utf8');
    const json = JSON.parse(raw);
    if (Array.isArray(json))
        return json; // ← いま手元の形式（配列）
    if (Array.isArray(json?.abi))
        return json.abi; // ← artifacts 形式
    throw new Error(`Invalid ABI JSON (no array found): ${abiPath}`);
}
export class ERC8004Client {
    provider;
    wallets;
    identity;
    reputation;
    validation;
    constructor() {
        const rpcUrl = process.env.RPC_URL ?? 'http://127.0.0.1:8545';
        this.provider = new JsonRpcProvider(rpcUrl);
        const pkA = process.env.PRIVATE_KEY_ANALYST;
        const pkV = process.env.PRIVATE_KEY_VALIDATOR;
        const pkC = process.env.PRIVATE_KEY_CLIENT;
        this.wallets = {
            ANALYST: new Wallet(pkA, this.provider),
            VALIDATOR: new Wallet(pkV, this.provider),
            CLIENT: new Wallet(pkC, this.provider),
        };
        const deployment = JSON.parse(fs.readFileSync(path.resolve('deployment.json'), 'utf8')).contracts;
        const idAbi = loadAbi('abi/IdentityRegistry.json');
        const repAbi = loadAbi('abi/ReputationRegistry.json');
        const valAbi = loadAbi('abi/ValidationRegistry.json');
        // 既定は VALIDATOR ウォレットで bind（tx は都度 from を切替可能）
        this.identity = new Contract(deployment.identity_registry, idAbi, this.wallets.VALIDATOR);
        this.reputation = new Contract(deployment.reputation_registry, repAbi, this.wallets.VALIDATOR);
        this.validation = new Contract(deployment.validation_registry, valAbi, this.wallets.VALIDATOR);
    }
    // ---- Helpers ----
    wallet(role) {
        const key = process.env.DEFAULT_WALLET || 'VALIDATOR';
        return this.wallets[role ?? key];
    }
    // ---- Identity ----
    async registerAgent(domain, role) {
        const w = this.wallet(role);
        const id = this.identity.connect(w);
        // newAgent(domain, address)
        const newAgent = id.getFunction('newAgent');
        const tx = await newAgent(domain, await w.getAddress());
        const rc = await tx.wait();
        // resolveByAddress(address) -> (agentId, agentDomain, agentAddress)
        const resolveByAddress = id.getFunction('resolveByAddress');
        const info = await resolveByAddress(await w.getAddress());
        // info は配列/オブジェクトのハイブリッド。プロパティ名でアクセス可能なはずですが、
        // 念のため Number(...) で agentId を数値化
        return { txHash: rc?.hash, agentId: Number(info.agentId), agent: info };
    }
    async resolveByAddress(address) {
        const fn = this.identity.getFunction('resolveByAddress');
        const info = await fn(address);
        return {
            agentId: Number(info.agentId),
            agentDomain: info.agentDomain,
            agentAddress: info.agentAddress
        };
    }
    async resolveByDomain(domain) {
        const fn = this.identity.getFunction('resolveByDomain');
        const info = await fn(domain);
        return {
            agentId: Number(info.agentId),
            agentDomain: info.agentDomain,
            agentAddress: info.agentAddress
        };
    }
    // ---- Reputation ----
    async authorizeFeedback(clientId, serverId, role) {
        const w = this.wallet(role); // server の本人鍵
        const rep = this.reputation.connect(w);
        const acceptFeedback = rep.getFunction('acceptFeedback');
        const tx = await acceptFeedback(clientId, serverId);
        const rc = await tx.wait();
        return { txHash: rc?.hash };
    }
    // ---- Validation ----
    async requestValidation(validatorId, serverId, dataHashHex, role) {
        const w = this.wallet(role); // server の本人鍵
        const val = this.validation.connect(w);
        const request = val.getFunction('validationRequest');
        const bytes32Hash = '0x' + dataHashHex; // 64桁hex想定
        const tx = await request(validatorId, serverId, bytes32Hash);
        const rc = await tx.wait();
        return { txHash: rc?.hash };
    }
    async submitValidationResponse(dataHashHex, score, role) {
        const w = this.wallet(role); // validator の本人鍵
        const val = this.validation.connect(w);
        const respond = val.getFunction('validationResponse');
        const bytes32Hash = '0x' + dataHashHex;
        const tx = await respond(bytes32Hash, score);
        const rc = await tx.wait();
        return { txHash: rc?.hash };
    }
    async getValidationResponse(dataHashHex) {
        const fn = this.validation.getFunction('getValidationResponse');
        const [hasResponse, response] = await fn('0x' + dataHashHex);
        return { hasResponse, score: Number(response) };
    }
}
