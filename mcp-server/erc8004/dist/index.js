import dotenv from 'dotenv';
import Ajv from 'ajv';
import { connection, InitializeRequest, ToolsListRequest, ToolsCallRequest, log } from './mcp.js';
import { ERC8004Client } from './erc8004.js';
import { schemas } from './schemas.js';
dotenv.config();
const ajv = new Ajv();
const validate = (name, args) => {
    const v = ajv.compile(schemas[name]);
    if (!v(args)) {
        const msg = (v.errors ?? []).map(e => `${e.instancePath} ${e.message}`).join('; ');
        throw new Error(`Invalid arguments for ${name}: ${msg}`);
    }
};
const client = new ERC8004Client();
// ---- MCP lifecycle ----
connection.onRequest(InitializeRequest, async (_params) => {
    log('info', 'MCP ERC8004 server initialized');
    return {
        protocolVersion: '2024-06-01',
        serverName: 'mcp-erc8004',
        serverVersion: '0.1.0',
        capabilities: { tools: {} }
    };
});
connection.onRequest(ToolsListRequest, async () => {
    return {
        tools: [
            { name: 'register_agent', description: 'Register caller as agent in IdentityRegistry', inputSchema: schemas.register_agent },
            { name: 'authorize_feedback', description: 'Server authorizes client feedback', inputSchema: schemas.authorize_feedback },
            { name: 'request_validation', description: 'Server requests validation from validator for dataHash', inputSchema: schemas.request_validation },
            { name: 'submit_validation_response', description: 'Validator submits validation score for dataHash', inputSchema: schemas.submit_validation_response },
            { name: 'resolve_agent_by_address', description: 'Resolve agent info by EOA', inputSchema: schemas.resolve_agent_by_address },
            { name: 'resolve_agent_by_domain', description: 'Resolve agent info by domain', inputSchema: schemas.resolve_agent_by_domain },
            { name: 'get_validation_response', description: 'Read validation response for dataHash', inputSchema: schemas.get_validation_response }
        ]
    };
});
connection.onRequest(ToolsCallRequest, async ({ name, arguments: args }) => {
    try {
        switch (name) {
            case 'register_agent': {
                validate('register_agent', args);
                // どの鍵で登録するかは DEFAULT_WALLET か、domain から運用ポリシーで切替も可
                const role = process.env.DEFAULT_WALLET || 'VALIDATOR';
                const { txHash, agentId, agent } = await client.registerAgent(String(args.domain).toLowerCase(), role);
                return { ok: true, txHash, agentId, agent };
            }
            case 'authorize_feedback': {
                validate('authorize_feedback', args);
                const { txHash } = await client.authorizeFeedback(Number(args.clientId), Number(args.serverId), 'ANALYST' /* server 鍵想定 */);
                return { ok: true, txHash };
            }
            case 'request_validation': {
                validate('request_validation', args);
                const { txHash } = await client.requestValidation(Number(args.validatorId), Number(args.serverId), String(args.dataHash).toLowerCase(), 'ANALYST' /* server 鍵想定 */);
                return { ok: true, txHash };
            }
            case 'submit_validation_response': {
                validate('submit_validation_response', args);
                const { txHash } = await client.submitValidationResponse(String(args.dataHash).toLowerCase(), Number(args.score), 'VALIDATOR');
                return { ok: true, txHash };
            }
            case 'resolve_agent_by_address': {
                validate('resolve_agent_by_address', args);
                const info = await client.resolveByAddress(String(args.address));
                return { ok: true, ...info };
            }
            case 'resolve_agent_by_domain': {
                validate('resolve_agent_by_domain', args);
                const info = await client.resolveByDomain(String(args.domain).toLowerCase());
                return { ok: true, ...info };
            }
            case 'get_validation_response': {
                validate('get_validation_response', args);
                const res = await client.getValidationResponse(String(args.dataHash).toLowerCase());
                return { ok: true, ...res };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (err) {
        log('error', `tool ${name} failed: ${err.message}`);
        return { ok: false, error: err.message };
    }
});
// start
connection.listen();
