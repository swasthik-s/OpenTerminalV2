# OpenTerminal MT5 Bridge EA

Read-only Expert Advisor that publishes an MT5 account snapshot to the OpenTerminal API.

## Current scope

- Account identity and account metrics
- Open positions
- Active pending orders
- Deal history for the configured lookback window
- Timer-driven HTTP snapshot publishing
- Chart status and terminal log messages

The EA does not contain trade execution calls. It does not open, close, modify, or delete orders or positions.

## Install

1. Open MetaTrader 5.
2. Select **File → Open Data Folder**.
3. Open **MQL5/Experts**.
4. Copy `OpenTerminalBridge.mq5` into that folder (or copy the `mt5/Experts` contents into the matching folder).
5. Open MetaEditor, locate the EA, and compile it.
6. In MT5, open **Tools → Options → Expert Advisors**.
7. Enable **Allow WebRequest for listed URL** and add the exact API origin, for example:
   `http://127.0.0.1:8000`
8. Attach **OpenTerminalBridge** to a chart.

## Inputs

| Input | Default | Description |
|---|---:|---|
| `InpApiUrl` | `http://127.0.0.1:8000/api/mt5/snapshot` | Snapshot API endpoint |
| `InpApiToken` | empty | Optional bearer token |
| `InpSyncIntervalSec` | 10 | Snapshot interval |
| `InpHistoryDays` | 30 | Deal history lookback |
| `InpHttpTimeoutMs` | 3000 | HTTP timeout |
| `InpSendOnStart` | true | Publish immediately on initialization |

## Important current limitation

The EA expects a receiving API endpoint at `POST /api/mt5/snapshot`. The EA is the terminal-side publisher; the receiving API and database still need to be implemented. Until that endpoint exists, the EA will report an HTTP connection failure.

For local testing, run the API on the same Windows machine as MT5 and use the loopback address. Do not expose an unauthenticated endpoint to the public internet.

## Testing notes

- Start with an MT5 demo account.
- Compile in MetaEditor and inspect all compiler warnings/errors.
- Attach the EA to one chart only for the initial test.
- Confirm the Experts and Journal tabs show successful HTTP responses.
- Compare account metrics, open positions and deal tickets with the MT5 terminal.
- WebRequest is synchronous and is not available in the MT5 Strategy Tester; validate HTTP delivery on a running terminal.

This is an initial bridge implementation. Verify compilation and payload compatibility against the receiving API before relying on it.
