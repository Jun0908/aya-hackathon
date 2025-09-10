import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  NotificationType,
  RequestType
} from 'vscode-jsonrpc/node.js';   // ← .js を付ける

// 接続
export const connection = createMessageConnection(
  new StreamMessageReader(process.stdin),
  new StreamMessageWriter(process.stdout)
);

// MCP-like message shapes
export const InitializeRequest = new RequestType<any, any, void>('initialize');
export const ToolsListRequest  = new RequestType<void, { tools: any[] }, void>('tools/list');
export const ToolsCallRequest  = new RequestType<{ name: string; arguments?: any }, any, void>('tools/call');

// Helper to send log/trace to client
export const LogNotification = new NotificationType<{ level: 'info'|'warn'|'error'; message: string }>('log');
export function log(level: 'info'|'warn'|'error', message: string) {
  // stdoutはRPC専用 → ログはstderrへ
  console.error(`[mcp][${level}]`, message);
  connection.sendNotification(LogNotification, { level, message });
}

