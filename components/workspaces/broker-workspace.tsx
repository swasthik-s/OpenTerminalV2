"use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowDownUp, BookOpen, CheckCircle2, CircleAlert, Clock3,
  Cloud, Database, Download, ExternalLink, FileClock, Link2, Plus,
  RefreshCw, Search, Settings2, ShieldCheck, Terminal, Unplug, Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Broker = { name: string; platform: string; accountType: string; state: "Not connected" | "Setup required"; detail: string };
const brokers: Broker[] = [
  { name: "MetaTrader 5", platform: "MT5 terminal bridge", accountType: "Demo / Live", state: "Setup required", detail: "Connect through a local Windows terminal agent" },
  { name: "cTrader", platform: "cTrader Open API", accountType: "Demo / Live", state: "Setup required", detail: "OAuth-based account connection" },
];

const sampleTrades = [
  { date: "2026-11-09 10:42:18", symbol: "XAUUSD", side: "BUY", volume: "0.02", entry: "4,012.40", exit: "4,015.10", pnl: "+5.40", tag: "Liquidity sweep", result: "Win" },
  { date: "2026-11-09 09:16:03", symbol: "EURUSD", side: "SELL", volume: "0.05", entry: "1.15420", exit: "1.15455", pnl: "-1.75", tag: "Trend continuation", result: "Loss" },
  { date: "2026-11-08 15:31:44", symbol: "XAUUSD", side: "BUY", volume: "0.01", entry: "3,998.20", exit: "4,002.60", pnl: "+4.40", tag: "Absorption", result: "Win" },
];

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <Card className="app-panel"><CardContent className="p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-[11px] text-muted-foreground">{note}</div></CardContent></Card>;
}

function Connections() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [terminalPath, setTerminalPath] = useState("");
  const [account, setAccount] = useState("");
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Broker connections</h2><p className="text-xs text-muted-foreground">Manage terminals and broker accounts linked to this workspace.</p></div><Badge variant="outline" className="gap-1.5"><span className="size-1.5 rounded-full bg-amber-400"/> 0 active connections</Badge></div>
    <div className="grid gap-3 xl:grid-cols-2">{brokers.map((broker) => <Card key={broker.name} className="app-panel"><CardHeader className="flex-row items-start justify-between space-y-0 p-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-secondary"><Terminal className="size-5"/></div><div><CardTitle className="text-sm">{broker.name}</CardTitle><CardDescription className="mt-1 text-xs">{broker.platform}</CardDescription></div></div><Badge variant="outline">{broker.state}</Badge></CardHeader><CardContent className="space-y-3 px-4 pb-4"><p className="text-xs text-muted-foreground">{broker.detail}</p><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Account types</span><span>{broker.accountType}</span></div><Separator/><Button size="sm" variant="outline" className="w-full" onClick={() => setExpanded(expanded === broker.name ? null : broker.name)}><Settings2 className="size-4"/> {expanded === broker.name ? "Close setup" : "Configure connection"}</Button>{expanded === broker.name && <div className="space-y-3 rounded-xl border border-border bg-background/50 p-3"><div className="text-xs font-semibold">Connection profile</div><div className="space-y-1"><label className="text-[11px] text-muted-foreground">Terminal path / bridge endpoint</label><Input value={terminalPath} onChange={e=>setTerminalPath(e.target.value)} placeholder={broker.name === "MetaTrader 5" ? "C:\\Program Files\\MetaTrader 5\\terminal64.exe" : "https://your-connector-host"}/></div><div className="space-y-1"><label className="text-[11px] text-muted-foreground">Account label (optional)</label><Input value={account} onChange={e=>setAccount(e.target.value)} placeholder="e.g. FTMO Demo"/></div><p className="text-[11px] text-muted-foreground">UI setup only. Credentials and live connection testing require the local broker bridge. Never enter your trading password here.</p><Badge variant="outline">Not connected · configuration not saved</Badge></div>}</CardContent></Card>)}</div>
    <Card className="app-panel"><CardContent className="flex gap-3 p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary"/><div><div className="text-sm font-medium">Credential isolation</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Broker passwords, API secrets and terminal credentials must remain in the local connector or a server-side secrets vault. The browser UI should only receive connection status and account data.</p></div></CardContent></Card>
  </div>;
}

function BrokerSync() {
  const [mode, setMode] = useState("manual");
  const [scope, setScope] = useState("all");
  return <div className="space-y-4">
    <div><h2 className="text-base font-semibold">Broker data synchronization</h2><p className="text-xs text-muted-foreground">Plan how account activity is imported into the OpenTerminal ledger.</p></div>
    <div className="grid gap-3 md:grid-cols-3"><Metric label="BROKER STATUS" value="Offline" note="No connector is active"/><Metric label="LAST SYNC" value="—" note="Waiting for first connection"/><Metric label="PENDING RECORDS" value="—" note="No broker data received"/></div>
    <Card className="app-panel"><CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Sync configuration</CardTitle><CardDescription className="text-xs">Choose the records and synchronization policy.</CardDescription></CardHeader><CardContent className="space-y-4 p-4 pt-2">
      <div className="grid gap-2 sm:grid-cols-2"><label className="space-y-1 text-xs"><span className="text-muted-foreground">Sync mode</span><select value={mode} onChange={e=>setMode(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="manual">Manual sync</option><option value="scheduled">Scheduled sync (connector required)</option><option value="realtime">Near real-time (connector required)</option></select></label><label className="space-y-1 text-xs"><span className="text-muted-foreground">Import scope</span><select value={scope} onChange={e=>setScope(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="all">All supported records</option><option value="deals">Closed deals only</option><option value="orders">Orders and executions</option><option value="positions">Positions and account snapshots</option></select></label></div>
      <div className="grid gap-2 sm:grid-cols-2">{["Closed deals & executions","Orders & cancellations","Deposits & withdrawals","Account balance snapshots","Open positions (snapshot)","Commissions, swaps & fees"].map(x=><div key={x} className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs"><CheckCircle2 className="size-3.5 text-primary"/>{x}</div>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><div className="flex gap-2"><CircleAlert className="size-4 shrink-0 text-amber-400"/><div><div className="text-xs font-medium">Connector unavailable</div><p className="mt-1 text-[11px] text-muted-foreground">Sync is disabled until a broker terminal is connected and authenticated.</p></div></div><Button size="sm" disabled><RefreshCw className="size-3.5"/> Sync now</Button></div>
      <div className="text-[11px] text-muted-foreground">Selected: {mode} · {scope}. Sync should be idempotent, deduplicate by broker ticket/deal ID, and retain the original broker timestamps.</div>
    </CardContent></Card>
    <Card className="app-panel"><CardHeader className="p-4"><CardTitle className="text-sm">Data pipeline</CardTitle></CardHeader><CardContent className="grid gap-2 p-4 pt-0 sm:grid-cols-4">{[{name:"Broker terminal",desc:"MT5 / cTrader",icon:Terminal},{name:"Connector agent",desc:"Read & normalize",icon:ArrowDownUp},{name:"Sync service",desc:"Deduplicate & store",icon:Database},{name:"Trading journal",desc:"Review & analyze",icon:BookOpen}].map((s,i)=><div key={s.name} className="flex items-center gap-2 rounded-lg border border-border p-3"><s.icon className="size-4 text-primary"/><div><div className="text-xs font-medium">{s.name}</div><div className="text-[10px] text-muted-foreground">{s.desc}</div></div>{i<3&&<span className="ml-auto hidden text-muted-foreground sm:block">→</span>}</div>)}</CardContent></Card>
  </div>;
}

function Journal() {
  const [query,setQuery] = useState("");
  const rows = useMemo(()=>sampleTrades.filter(t=>[t.symbol,t.side,t.tag,t.result].join(" ").toLowerCase().includes(query.toLowerCase())),[query]);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Trading journal</h2><p className="text-xs text-muted-foreground">A unified ledger for broker-imported trades, notes and strategy reviews.</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled><Download className="size-4"/> Export</Button><Button size="sm" disabled><Plus className="size-4"/> Add trade</Button></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="NET P&L" value="—" note="Connect a broker to calculate"/><Metric label="WIN RATE" value="—" note="Based on closed trades"/><Metric label="TRADES" value="—" note="No imported trade history"/><Metric label="AVG R-MULTIPLE" value="—" note="Requires risk data"/></div>
    <div className="flex flex-wrap items-center gap-2"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input className="pl-9" placeholder="Filter symbol, side, tag..." value={query} onChange={e=>setQuery(e.target.value)}/></div><Badge variant="outline">Illustrative preview rows</Badge></div>
    <Card className="app-panel"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="border-b border-border bg-background/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr>{["Date / time","Symbol","Side","Volume","Entry","Exit","Net P&L","Setup tag","Result"].map(x=><th key={x} className="px-3 py-3 font-medium">{x}</th>)}</tr></thead><tbody>{rows.map((t,i)=><tr key={t.date} className="border-b border-border/60 last:border-0"><td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{t.date}</td><td className="px-3 py-3 font-semibold">{t.symbol}</td><td className="px-3 py-3">{t.side}</td><td className="px-3 py-3">{t.volume}</td><td className="px-3 py-3">{t.entry}</td><td className="px-3 py-3">{t.exit}</td><td className={`px-3 py-3 font-semibold ${t.pnl.startsWith("+")?"text-emerald-400":"text-rose-400"}`}>{t.pnl}</td><td className="px-3 py-3 text-muted-foreground">{t.tag}</td><td className="px-3 py-3"><Badge variant="outline">{t.result}</Badge></td></tr>)}{rows.length===0&&<tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No matching preview records.</td></tr>}</tbody></table></div><div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">Preview data only — these are not live account trades.</div></Card>
    <div className="grid gap-3 lg:grid-cols-2"><Card className="app-panel"><CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Trade review fields</CardTitle></CardHeader><CardContent className="space-y-2 p-4 pt-2 text-xs text-muted-foreground">{["Strategy / setup classification","Entry and exit rationale","Screenshot and chart attachment","Execution quality and slippage","Emotional / discipline notes","Mistake tags and lessons learned"].map(x=><div key={x} className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary"/>{x}</div>)}</CardContent></Card><Card className="app-panel"><CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Journal data integrity</CardTitle></CardHeader><CardContent className="space-y-2 p-4 pt-2 text-xs text-muted-foreground"><p>Broker-imported execution facts should be immutable. Add personal notes and tags as separate journal metadata so later edits never rewrite the broker's original record.</p><p>Partial closes, commissions, swaps and fees must be represented correctly before net P&L and win-rate statistics are calculated.</p></CardContent></Card></div>
  </div>;
}

export function BrokerWorkspace() {
  const [tab,setTab] = useState("connections");
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-[.16em] text-primary">EXECUTION / ACCOUNT INFRASTRUCTURE</div><h1 className="mt-2 text-3xl font-semibold tracking-tight">Broker & journal</h1><p className="mt-1 text-sm text-muted-foreground">Connect trading terminals, synchronize account activity and maintain a unified trading journal.</p></div><Badge variant="outline" className="gap-1.5"><span className="size-1.5 rounded-full bg-amber-400"/> PAPER / PREVIEW</Badge></div>
    <Tabs value={tab} onValueChange={setTab} className="space-y-4"><TabsList className="h-auto flex-wrap"><TabsTrigger value="connections" className="gap-2"><Link2 className="size-3.5"/> Connections</TabsTrigger><TabsTrigger value="sync" className="gap-2"><RefreshCw className="size-3.5"/> Broker sync</TabsTrigger><TabsTrigger value="journal" className="gap-2"><BookOpen className="size-3.5"/> Trading journal</TabsTrigger></TabsList><TabsContent value="connections"><Connections/></TabsContent><TabsContent value="sync"><BrokerSync/></TabsContent><TabsContent value="journal"><Journal/></TabsContent></Tabs>
    <div className="flex items-start gap-2 rounded-xl border border-border bg-background/30 p-3 text-[11px] leading-5 text-muted-foreground"><Activity className="mt-0.5 size-4 shrink-0 text-primary"/> This release adds the UI foundation only. No broker is connected, no credentials are stored, and no trades or synchronization actions are executed.</div>
  </div>;
}
