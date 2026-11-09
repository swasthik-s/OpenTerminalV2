//+------------------------------------------------------------------+
//| OpenTerminal MT5 Bridge EA                                       |
//| Read-only account and trade-data exporter.                       |
//| No trade requests are sent by this Expert Advisor.                |
//+------------------------------------------------------------------+
#property copyright "OpenTerminal"
#property version   "0.1.0"
#property strict
#property description "Read-only bridge that publishes MT5 account, positions and deal history to OpenTerminal."

input string InpApiUrl          = "http://127.0.0.1:8000/api/mt5/snapshot";
input string InpApiToken        = "";       // Optional bearer token for local API
input int    InpSyncIntervalSec = 10;       // Snapshot interval
input int    InpHistoryDays     = 30;       // Deal history lookback
input int    InpHttpTimeoutMs   = 3000;     // HTTP timeout
input bool   InpSendOnStart     = true;

datetime g_last_sync = 0;
bool     g_sync_busy = false;
string   g_last_status = "Starting";

string JsonEscape(const string value)
{
   string out = "";
   for(int i = 0; i < StringLen(value); i++)
   {
      ushort c = StringGetCharacter(value, i);
      if(c == 34)      out += "\\\"";
      else if(c == 92) out += "\\\\";
      else if(c == 8)  out += "\\b";
      else if(c == 9)  out += "\\t";
      else if(c == 10) out += "\\n";
      else if(c == 12) out += "\\f";
      else if(c == 13) out += "\\r";
      else if(c < 32)  out += " ";
      else             out += ShortToString(c);
   }
   return out;
}

string JString(const string value) { return "\"" + JsonEscape(value) + "\""; }
string JNumber(const double value, const int digits=8) { return DoubleToString(value, digits); }

string BuildPositionsJson()
{
   string json = "[";
   bool first = true;
   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;

      if(!first) json += ",";
      first = false;

      string symbol = PositionGetString(POSITION_SYMBOL);
      long type = PositionGetInteger(POSITION_TYPE);
      json += "{";
      json += "\"ticket\":" + StringFormat("%I64u", ticket) + ",";
      json += "\"identifier\":" + StringFormat("%I64u", (ulong)PositionGetInteger(POSITION_IDENTIFIER)) + ",";
      json += "\"symbol\":" + JString(symbol) + ",";
      json += "\"type\":" + IntegerToString((int)type) + ",";
      json += "\"side\":" + JString(type == POSITION_TYPE_BUY ? "BUY" : "SELL") + ",";
      json += "\"volume\":" + JNumber(PositionGetDouble(POSITION_VOLUME), 8) + ",";
      json += "\"price_open\":" + JNumber(PositionGetDouble(POSITION_PRICE_OPEN), 10) + ",";
      json += "\"price_current\":" + JNumber(PositionGetDouble(POSITION_PRICE_CURRENT), 10) + ",";
      json += "\"stop_loss\":" + JNumber(PositionGetDouble(POSITION_SL), 10) + ",";
      json += "\"take_profit\":" + JNumber(PositionGetDouble(POSITION_TP), 10) + ",";
      json += "\"profit\":" + JNumber(PositionGetDouble(POSITION_PROFIT), 2) + ",";
      json += "\"swap\":" + JNumber(PositionGetDouble(POSITION_SWAP), 2) + ",";
      json += "\"time\":" + StringFormat("%I64d", (long)PositionGetInteger(POSITION_TIME));
      json += "}";
   }
   json += "]";
   return json;
}

string BuildActiveOrdersJson()
{
   string json = "[";
   bool first = true;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      ulong ticket = OrderGetTicket(i);
      if(ticket == 0) continue;

      if(!first) json += ",";
      first = false;

      json += "{";
      json += "\"ticket\":" + StringFormat("%I64u", ticket) + ",";
      json += "\"symbol\":" + JString(OrderGetString(ORDER_SYMBOL)) + ",";
      json += "\"type\":" + IntegerToString((int)OrderGetInteger(ORDER_TYPE)) + ",";
      json += "\"state\":" + IntegerToString((int)OrderGetInteger(ORDER_STATE)) + ",";
      json += "\"volume_initial\":" + JNumber(OrderGetDouble(ORDER_VOLUME_INITIAL), 8) + ",";
      json += "\"volume_current\":" + JNumber(OrderGetDouble(ORDER_VOLUME_CURRENT), 8) + ",";
      json += "\"price_open\":" + JNumber(OrderGetDouble(ORDER_PRICE_OPEN), 10) + ",";
      json += "\"stop_loss\":" + JNumber(OrderGetDouble(ORDER_SL), 10) + ",";
      json += "\"take_profit\":" + JNumber(OrderGetDouble(ORDER_TP), 10) + ",";
      json += "\"time_setup\":" + StringFormat("%I64d", (long)OrderGetInteger(ORDER_TIME_SETUP));
      json += "}";
   }
   json += "]";
   return json;
}

string BuildDealsJson()
{
   string json = "[";
   bool first = true;
   datetime to_time = TimeCurrent();
   datetime from_time = to_time - (datetime)(InpHistoryDays * 86400);

   if(!HistorySelect(from_time, to_time))
      return json + "]";

   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      if(!first) json += ",";
      first = false;

      json += "{";
      json += "\"ticket\":" + StringFormat("%I64u", ticket) + ",";
      json += "\"order_ticket\":" + StringFormat("%I64u", (ulong)HistoryDealGetInteger(ticket, DEAL_ORDER)) + ",";
      json += "\"position_id\":" + StringFormat("%I64u", (ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID)) + ",";
      json += "\"time\":" + StringFormat("%I64d", (long)HistoryDealGetInteger(ticket, DEAL_TIME)) + ",";
      json += "\"time_msc\":" + StringFormat("%I64d", (long)HistoryDealGetInteger(ticket, DEAL_TIME_MSC)) + ",";
      json += "\"symbol\":" + JString(HistoryDealGetString(ticket, DEAL_SYMBOL)) + ",";
      json += "\"type\":" + IntegerToString((int)HistoryDealGetInteger(ticket, DEAL_TYPE)) + ",";
      json += "\"entry\":" + IntegerToString((int)HistoryDealGetInteger(ticket, DEAL_ENTRY)) + ",";
      json += "\"volume\":" + JNumber(HistoryDealGetDouble(ticket, DEAL_VOLUME), 8) + ",";
      json += "\"price\":" + JNumber(HistoryDealGetDouble(ticket, DEAL_PRICE), 10) + ",";
      json += "\"profit\":" + JNumber(HistoryDealGetDouble(ticket, DEAL_PROFIT), 2) + ",";
      json += "\"commission\":" + JNumber(HistoryDealGetDouble(ticket, DEAL_COMMISSION), 2) + ",";
      json += "\"swap\":" + JNumber(HistoryDealGetDouble(ticket, DEAL_SWAP), 2) + ",";
      json += "\"fee\":" + JNumber(HistoryDealGetDouble(ticket, DEAL_FEE), 2) + ",";
      json += "\"comment\":" + JString(HistoryDealGetString(ticket, DEAL_COMMENT));
      json += "}";
   }
   json += "]";
   return json;
}

string BuildPayload()
{
   long login = AccountInfoInteger(ACCOUNT_LOGIN);
   string server = AccountInfoString(ACCOUNT_SERVER);
   string company = AccountInfoString(ACCOUNT_COMPANY);
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   string payload = "{";
   payload += "\"schema_version\":1,";
   payload += "\"source\":\"openterminal-mt5-ea\",";
   payload += "\"sent_at\":" + StringFormat("%I64d", (long)TimeCurrent()) + ",";
   payload += "\"terminal\":{";
   payload += "\"name\":" + JString(TerminalInfoString(TERMINAL_NAME)) + ",";
   payload += "\"build\":" + IntegerToString((int)TerminalInfoInteger(TERMINAL_BUILD)) + ",";
   payload += "\"connected\":" + (TerminalInfoInteger(TERMINAL_CONNECTED) ? "true" : "false");
   payload += "},";
   payload += "\"account\":{";
   payload += "\"login\":" + StringFormat("%I64d", login) + ",";
   payload += "\"server\":" + JString(server) + ",";
   payload += "\"company\":" + JString(company) + ",";
   payload += "\"currency\":" + JString(currency) + ",";
   payload += "\"name\":" + JString(AccountInfoString(ACCOUNT_NAME)) + ",";
   payload += "\"leverage\":" + IntegerToString((int)AccountInfoInteger(ACCOUNT_LEVERAGE)) + ",";
   payload += "\"trade_mode\":" + IntegerToString((int)AccountInfoInteger(ACCOUNT_TRADE_MODE)) + ",";
   payload += "\"balance\":" + JNumber(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
   payload += "\"equity\":" + JNumber(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
   payload += "\"margin\":" + JNumber(AccountInfoDouble(ACCOUNT_MARGIN), 2) + ",";
   payload += "\"free_margin\":" + JNumber(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2) + ",";
   payload += "\"margin_level\":" + JNumber(AccountInfoDouble(ACCOUNT_MARGIN_LEVEL), 2) + ",";
   payload += "\"profit\":" + JNumber(AccountInfoDouble(ACCOUNT_PROFIT), 2);
   payload += "},";
   payload += "\"positions\":" + BuildPositionsJson() + ",";
   payload += "\"active_orders\":" + BuildActiveOrdersJson() + ",";
   payload += "\"deals\":" + BuildDealsJson();
   payload += "}";
   return payload;
}

bool PublishSnapshot()
{
   if(g_sync_busy) return false;
   g_sync_busy = true;

   string payload = BuildPayload();
   char data[];
   char result[];
   string result_headers = "";
   int copied = StringToCharArray(payload, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(copied > 0) ArrayResize(data, copied - 1);

   string headers = "Content-Type: application/json\r\n";
   headers += "X-OpenTerminal-Agent: mt5-ea/0.1.0\r\n";
   if(StringLen(InpApiToken) > 0)
      headers += "Authorization: Bearer " + InpApiToken + "\r\n";

   ResetLastError();
   int status = WebRequest("POST", InpApiUrl, headers, InpHttpTimeoutMs,
                           data, result, result_headers);

   if(status >= 200 && status < 300)
   {
      g_last_status = "Connected · HTTP " + IntegerToString(status);
      g_last_sync = TimeLocal();
      Print("[OpenTerminal] Snapshot accepted. HTTP ", status,
            " | bytes=", ArraySize(data));
      g_sync_busy = false;
      return true;
   }

   int err = GetLastError();
   if(status == -1)
      g_last_status = "HTTP error " + IntegerToString(err);
   else
      g_last_status = "Server HTTP " + IntegerToString(status);

   Print("[OpenTerminal] Publish failed. status=", status,
         " error=", err, " | Check API availability and MT5 allowed URLs.");
   g_sync_busy = false;
   return false;
}

void UpdateChartStatus()
{
   string account = StringFormat("%I64d", AccountInfoInteger(ACCOUNT_LOGIN));
   string last = (g_last_sync > 0 ? TimeToString(g_last_sync, TIME_SECONDS) : "Never");
   Comment("OpenTerminal MT5 Bridge v0.1.0\n",
           "Mode: READ ONLY\n",
           "Account: ", account, " @ ", AccountInfoString(ACCOUNT_SERVER), "\n",
           "Status: ", g_last_status, "\n",
           "Last successful sync: ", last, "\n",
           "Positions: ", PositionsTotal(), " | Active orders: ", OrdersTotal());
}

int OnInit()
{
   if(InpSyncIntervalSec < 1 || InpHistoryDays < 1 || InpHttpTimeoutMs < 250)
   {
      Print("[OpenTerminal] Invalid input parameters.");
      return INIT_PARAMETERS_INCORRECT;
   }

   EventSetTimer(InpSyncIntervalSec);
   g_last_status = "Waiting for first sync";
   UpdateChartStatus();
   if(InpSendOnStart) PublishSnapshot();
   UpdateChartStatus();
   Print("[OpenTerminal] Read-only bridge initialized. Endpoint: ", InpApiUrl);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Comment("");
   Print("[OpenTerminal] Bridge stopped. Reason: ", reason);
}

void OnTimer()
{
   PublishSnapshot();
   UpdateChartStatus();
}

void OnTick()
{
   // Intentionally unused. Synchronization is timer-driven, not tick-driven.
}
//+------------------------------------------------------------------+
