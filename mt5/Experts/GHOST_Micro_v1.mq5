//+------------------------------------------------------------------+
//| GHOST Micro v1 - MT5 Expert Advisor                              |
//| EMA trend + pullback + candle confirmation                       |
//| Risk-based sizing, ATR-buffered stop, fixed R multiple.            |
//+------------------------------------------------------------------+
#property copyright "GHOST / OpenTerminal"
#property version   "1.0.0"
#property strict
#property description "GHOST Micro v1: 200 EMA trend, 50 EMA pullback, candle confirmation, ATR stop and risk-based sizing."

#include <Trade/Trade.mqh>

input ENUM_TIMEFRAMES InpSignalTF       = PERIOD_M5;
input int             InpTrendEMA       = 200;
input int             InpPullbackEMA    = 50;
input int             InpATRPeriod      = 14;
input double          InpATRBuffer      = 0.20;
input double          InpRiskPercent    = 0.25;  // % of equity risked per trade
input double          InpRewardRisk     = 2.0;
input int             InpMaxTradesDay   = 2;
input double          InpMaxDailyLoss   = 2.0;   // % equity drawdown from day-start balance
input int             InpMaxSpreadPts   = 100;   // broker points; adjust for symbol
input int             InpSlippagePts    = 20;
input ulong           InpMagic          = 910021;
input bool            InpAllowLong      = true;
input bool            InpAllowShort     = true;
input bool            InpUseTrendSlope  = false;
input bool            InpDebug          = true;

CTrade trade;
int hTrend = INVALID_HANDLE;
int hPullback = INVALID_HANDLE;
int hATR = INVALID_HANDLE;
datetime lastBarTime = 0;
int dayKey = -1;
double dayStartEquity = 0.0;
int tradesToday = 0;

void Log(const string message)
{
   if(InpDebug) Print("[GHOST Micro] ", message);
}

int CurrentDayKey()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   return dt.year * 10000 + dt.mon * 100 + dt.day;
}

void RefreshDailyState()
{
   int key = CurrentDayKey();
   if(key != dayKey)
   {
      dayKey = key;
      dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
      tradesToday = 0;
      Log("New trading day. Start equity=" + DoubleToString(dayStartEquity, 2));
   }
}

bool IsNewBar()
{
   datetime t = iTime(_Symbol, InpSignalTF, 0);
   if(t == 0 || t == lastBarTime) return false;
   lastBarTime = t;
   return true;
}

bool ReadBufferValue(const int handle, const int shift, double &value)
{
   double values[];
   ArraySetAsSeries(values, true);
   if(CopyBuffer(handle, 0, shift, 1, values) != 1) return false;
   value = values[0];
   return true;
}

bool HasOurPosition()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) == _Symbol &&
         (ulong)PositionGetInteger(POSITION_MAGIC) == InpMagic)
         return true;
   }
   return false;
}

int CountTodayEntries()
{
   datetime now = TimeCurrent();
   MqlDateTime dt;
   TimeToStruct(now, dt);
   dt.hour = 0; dt.min = 0; dt.sec = 0;
   datetime from = StructToTime(dt);
   if(!HistorySelect(from, now)) return tradesToday;

   int count = 0;
   for(int i = 0; i < HistoryDealsTotal(); i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      if(HistoryDealGetString(ticket, DEAL_SYMBOL) != _Symbol) continue;
      if((ulong)HistoryDealGetInteger(ticket, DEAL_MAGIC) != InpMagic) continue;
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(entry == DEAL_ENTRY_IN || entry == DEAL_ENTRY_INOUT) count++;
   }
   return count;
}

bool DailyLossLimitHit()
{
   if(dayStartEquity <= 0.0) return false;
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double lossPct = (dayStartEquity - equity) / dayStartEquity * 100.0;
   return lossPct >= InpMaxDailyLoss;
}

double NormalizeVolume(double volume)
{
   double minVol = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxVol = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(step <= 0.0) return 0.0;

   volume = MathMin(maxVol, volume);
   volume = MathFloor(volume / step + 1e-9) * step;
   if(volume < minVol) return 0.0;

   int digits = 0;
   double s = step;
   while(digits < 8 && MathAbs(s - MathRound(s)) > 1e-8)
   {
      s *= 10.0;
      digits++;
   }
   return NormalizeDouble(volume, digits);
}

double CalculateVolume(const ENUM_ORDER_TYPE orderType,
                       const double entry, const double stopLoss)
{
   double riskMoney = AccountInfoDouble(ACCOUNT_EQUITY) * InpRiskPercent / 100.0;
   double oneLotProfit = 0.0;
   if(!OrderCalcProfit(orderType, _Symbol, 1.0, entry, stopLoss, oneLotProfit))
   {
      Log("OrderCalcProfit failed. Error=" + IntegerToString(GetLastError()));
      return 0.0;
   }

   double oneLotRisk = MathAbs(oneLotProfit);
   if(oneLotRisk <= 0.0) return 0.0;
   return NormalizeVolume(riskMoney / oneLotRisk);
}

bool SpreadAllowed()
{
   MqlTick tick;
   if(!SymbolInfoTick(_Symbol, tick)) return false;
   double spreadPts = (tick.ask - tick.bid) / _Point;
   if(spreadPts > InpMaxSpreadPts)
   {
      Log("Spread filter: " + DoubleToString(spreadPts, 1) + " points.");
      return false;
   }
   return true;
}

bool StopsValid(const bool isBuy, const double entry, const double sl, const double tp)
{
   int stopsLevel = (int)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double minDistance = stopsLevel * _Point;
   if(isBuy)
      return (entry - sl >= minDistance && tp - entry >= minDistance && sl < entry && tp > entry);
   return (sl - entry >= minDistance && entry - tp >= minDistance && sl > entry && tp < entry);
}

void EvaluateSignal()
{
   if(Bars(_Symbol, InpSignalTF) < InpTrendEMA + 10) return;
   if(!SpreadAllowed()) return;
   if(HasOurPosition()) return;

   RefreshDailyState();
   int historyEntries = CountTodayEntries();
   tradesToday = MathMax(tradesToday, historyEntries);
   if(tradesToday >= InpMaxTradesDay)
   {
      Log("Daily trade limit reached.");
      return;
   }
   if(DailyLossLimitHit())
   {
      Log("Daily equity loss limit reached. No new entries.");
      return;
   }

   double trend1, trend2, pull1, atr1;
   if(!ReadBufferValue(hTrend, 1, trend1) ||
      !ReadBufferValue(hTrend, 2, trend2) ||
      !ReadBufferValue(hPullback, 1, pull1) ||
      !ReadBufferValue(hATR, 1, atr1))
   {
      Log("Indicator data not ready.");
      return;
   }

   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(_Symbol, InpSignalTF, 0, 4, rates) < 4) return;

   MqlTick tick;
   if(!SymbolInfoTick(_Symbol, tick)) return;

   bool bullish = rates[1].close > rates[1].open;
   bool bearish = rates[1].close < rates[1].open;
   bool trendLong = rates[1].close > trend1;
   bool trendShort = rates[1].close < trend1;

   if(InpUseTrendSlope)
   {
      trendLong = trendLong && trend1 > trend2;
      trendShort = trendShort && trend1 < trend2;
   }

   // Signal candle must trade into/through the 50 EMA and close back on trend side.
   bool buySignal = InpAllowLong && trendLong && bullish &&
                    rates[1].low <= pull1 && rates[1].close > pull1 &&
                    rates[1].close > rates[2].high;

   bool sellSignal = InpAllowShort && trendShort && bearish &&
                     rates[1].high >= pull1 && rates[1].close < pull1 &&
                     rates[1].close < rates[2].low;

   if(!buySignal && !sellSignal) return;

   double entry = buySignal ? tick.ask : tick.bid;
   double sl = 0.0, tp = 0.0;
   double buffer = atr1 * InpATRBuffer;
   ENUM_ORDER_TYPE orderType;

   if(buySignal)
   {
      orderType = ORDER_TYPE_BUY;
      sl = rates[1].low - buffer;
      double riskDistance = entry - sl;
      if(riskDistance <= 0.0) return;
      tp = entry + riskDistance * InpRewardRisk;
   }
   else
   {
      orderType = ORDER_TYPE_SELL;
      sl = rates[1].high + buffer;
      double riskDistance = sl - entry;
      if(riskDistance <= 0.0) return;
      tp = entry - riskDistance * InpRewardRisk;
   }

   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   sl = NormalizeDouble(sl, digits);
   tp = NormalizeDouble(tp, digits);
   if(!StopsValid(buySignal, entry, sl, tp))
   {
      Log("Stop/target rejected by broker minimum stop distance.");
      return;
   }

   double volume = CalculateVolume(orderType, entry, sl);
   if(volume <= 0.0)
   {
      Log("Calculated volume is below broker minimum or invalid. No trade opened.");
      return;
   }

   bool sent = false;
   string comment = "GHOST Micro v1";
   if(buySignal)
      sent = trade.Buy(volume, _Symbol, 0.0, sl, tp, comment);
   else
      sent = trade.Sell(volume, _Symbol, 0.0, sl, tp, comment);

   uint retcode = trade.ResultRetcode();
   if(sent && (retcode == TRADE_RETCODE_DONE ||
               retcode == TRADE_RETCODE_PLACED ||
               retcode == TRADE_RETCODE_DONE_PARTIAL))
   {
      tradesToday++;
      Log(string(buySignal ? "BUY" : "SELL") +
          " submitted. Volume=" + DoubleToString(volume, 2) +
          " SL=" + DoubleToString(sl, digits) +
          " TP=" + DoubleToString(tp, digits) +
          " retcode=" + IntegerToString((int)retcode));
   }
   else
   {
      Log("Trade request failed. Retcode=" + IntegerToString((int)retcode) +
          " " + trade.ResultRetcodeDescription());
   }
}

int OnInit()
{
   if(InpRiskPercent <= 0 || InpRiskPercent > 2.0 ||
      InpRewardRisk <= 0 || InpMaxTradesDay < 1 ||
      InpMaxDailyLoss <= 0 || InpATRBuffer < 0)
   {
      Print("[GHOST Micro] Invalid inputs. Risk must be >0 and <=2%.");
      return INIT_PARAMETERS_INCORRECT;
   }

   hTrend = iMA(_Symbol, InpSignalTF, InpTrendEMA, 0, MODE_EMA, PRICE_CLOSE);
   hPullback = iMA(_Symbol, InpSignalTF, InpPullbackEMA, 0, MODE_EMA, PRICE_CLOSE);
   hATR = iATR(_Symbol, InpSignalTF, InpATRPeriod);

   if(hTrend == INVALID_HANDLE || hPullback == INVALID_HANDLE || hATR == INVALID_HANDLE)
   {
      Print("[GHOST Micro] Failed to create indicator handles. Error=", GetLastError());
      return INIT_FAILED;
   }

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(InpSlippagePts);
   trade.SetTypeFillingBySymbol(_Symbol);
   trade.SetAsyncMode(false);

   RefreshDailyState();
   lastBarTime = iTime(_Symbol, InpSignalTF, 0);
   Print("[GHOST Micro] Initialized on ", _Symbol, " / ", EnumToString(InpSignalTF),
         ". Risk=", DoubleToString(InpRiskPercent, 2), "% RR=1:",
         DoubleToString(InpRewardRisk, 2), ". Demo/backtest first.");
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   if(hTrend != INVALID_HANDLE) IndicatorRelease(hTrend);
   if(hPullback != INVALID_HANDLE) IndicatorRelease(hPullback);
   if(hATR != INVALID_HANDLE) IndicatorRelease(hATR);
   Print("[GHOST Micro] Deinitialized. Reason=", reason);
}

void OnTick()
{
   RefreshDailyState();
   if(IsNewBar()) EvaluateSignal();
}
//+------------------------------------------------------------------+
