import { createMessageConnection, StreamMessageReader, StreamMessageWriter, NotificationType, RequestType } from 'vscode-jsonrpc/node.js'; // ← .js を付ける
// 接続
export const connection = createMessageConnection(new StreamMessageReader(process.stdin), new StreamMessageWriter(process.stdout));
// MCP-like message shapes
export const InitializeRequest = new RequestType('initialize');
export const ToolsListRequest = new RequestType('tools/list');
export const ToolsCallRequest = new RequestType('tools/call');
// Helper to send log/trace to client
export const LogNotification = new NotificationType('log');
export function log(level, message) {
    // stdoutはRPC専用 → ログはstderrへ
    console.error(`[mcp][${level}]`, message);
    connection.sendNotification(LogNotification, { level, message });
}
