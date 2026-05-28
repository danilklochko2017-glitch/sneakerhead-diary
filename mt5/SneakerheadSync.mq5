//+------------------------------------------------------------------+
//|  SneakerheadSync.mq5                                             |
//|  Sends closed GER40 trades to Sneakerhead Diary (Notion)        |
//|  via the /api/mt5-import Next.js endpoint.                       |
//|                                                                  |
//|  Setup:                                                          |
//|  1. Paste your endpoint URL into ENDPOINT_URL                    |
//|  2. Paste your MT5_SECRET into API_SECRET                        |
//|  3. Attach to any chart (GER40 recommended)                      |
//|  4. Allow Tools → Options → Expert Advisors → "Allow WebRequest" |
//|     and add your domain to the whitelist                         |
//+------------------------------------------------------------------+
#property copyright "Sneakerhead Diary"
#property version   "1.00"
#property strict

//─── Input parameters ────────────────────────────────────────────────────────
input string ENDPOINT_URL = "https://YOUR-APP.vercel.app/api/mt5-import";
input string API_SECRET   = "YOUR_MT5_SECRET_HERE";

// Optional: only sync positions opened with this magic number (0 = all)
input int    MAGIC_FILTER = 0;

// BE threshold: if |profit| < this (in account currency), treat as BE
input double BE_THRESHOLD = 2.0;

// Risk % per trade — set manually or leave 0 to omit
input double RISK_PCT = 1.0;

//─── Globals ──────────────────────────────────────────────────────────────────
ulong g_sentTickets[];   // tickets already sent this session

//─── Helpers ─────────────────────────────────────────────────────────────────

bool AlreadySent(ulong ticket) {
   for (int i = 0; i < ArraySize(g_sentTickets); i++)
      if (g_sentTickets[i] == ticket) return true;
   return false;
}

void MarkSent(ulong ticket) {
   int n = ArraySize(g_sentTickets);
   ArrayResize(g_sentTickets, n + 1);
   g_sentTickets[n] = ticket;
}

string TimeToISO(datetime t) {
   MqlDateTime dt;
   TimeToStruct(t, dt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02dZ",
      dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);
}

string EscapeJson(string s) {
   StringReplace(s, "\\", "\\\\");
   StringReplace(s, "\"", "\\\"");
   StringReplace(s, "\n", "\\n");
   StringReplace(s, "\r", "");
   return s;
}

string BuildPayload(const MqlTradeTransaction& trans) {
   ulong  ticket     = trans.deal;
   string symbol     = trans.symbol;
   double volume     = trans.volume;

   // Fetch closing deal details from history
   if (!HistoryDealSelect(ticket)) return "";

   double closePrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
   double profit     = HistoryDealGetDouble(ticket, DEAL_PROFIT)
                     + HistoryDealGetDouble(ticket, DEAL_SWAP)
                     + HistoryDealGetDouble(ticket, DEAL_COMMISSION);
   datetime closeTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
   string comment     = EscapeJson(HistoryDealGetString(ticket, DEAL_COMMENT));
   long   positionId  = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);

   // OUT deal: SELL closes a Long, BUY closes a Short
   ENUM_DEAL_TYPE dealType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
   string direction = (dealType == DEAL_TYPE_SELL) ? "Long" : "Short";

   // Find the IN deal for this position to get open price, SL, TP, open time
   double   openPrice = closePrice; // fallback
   double   sl        = 0.0;
   double   tp        = 0.0;
   datetime openTime  = closeTime;

   int totalDeals = HistoryDealsTotal();
   for (int i = 0; i < totalDeals; i++) {
      ulong d = HistoryDealGetTicket(i);
      if (HistoryDealGetInteger(d, DEAL_POSITION_ID) != positionId) continue;
      ENUM_DEAL_ENTRY de = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(d, DEAL_ENTRY);
      if (de != DEAL_ENTRY_IN) continue;
      openPrice = HistoryDealGetDouble(d, DEAL_PRICE);
      sl        = HistoryDealGetDouble(d, DEAL_SL);
      tp        = HistoryDealGetDouble(d, DEAL_TP);
      openTime  = (datetime)HistoryDealGetInteger(d, DEAL_TIME);
      break;
   }

   string payload = StringFormat(
      "{"
         "\"symbol\":\"%s\","
         "\"direction\":\"%s\","
         "\"open_price\":%.5f,"
         "\"close_price\":%.5f,"
         "\"sl\":%.5f,"
         "\"tp\":%.5f,"
         "\"volume\":%.2f,"
         "\"profit\":%.2f,"
         "\"open_time\":\"%s\","
         "\"close_time\":\"%s\","
         "\"comment\":\"%s\","
         "\"magic\":%I64d,"
         "\"risk_pct\":%.2f"
      "}",
      EscapeJson(symbol),
      direction,
      openPrice,
      closePrice,
      sl,
      tp,
      volume,
      profit,
      TimeToISO(openTime),
      TimeToISO(closeTime),
      comment,
      HistoryDealGetInteger(ticket, DEAL_MAGIC),
      RISK_PCT
   );
   return payload;
}

void SendTrade(const MqlTradeTransaction& trans) {
   ulong ticket = trans.deal;
   if (ticket == 0 || AlreadySent(ticket)) return;

   // Only handle DEAL_ENTRY_OUT (closing deals)
   if (!HistoryDealSelect(ticket)) return;
   ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
   if (entry != DEAL_ENTRY_OUT) return;

   // Magic filter
   if (MAGIC_FILTER != 0 && HistoryDealGetInteger(ticket, DEAL_MAGIC) != MAGIC_FILTER) return;

   string payload = BuildPayload(trans);
   if (payload == "") {
      Print("[SneakerheadSync] Failed to build payload for ticket ", ticket);
      return;
   }

   // HTTP POST
   char   bodyArr[];
   char   responseArr[];
   string responseHeaders;
   StringToCharArray(payload, bodyArr, 0, StringLen(payload));

   string headers =
      "Content-Type: application/json\r\n"
      "x-api-secret: " + API_SECRET + "\r\n";

   int httpCode = WebRequest(
      "POST",
      ENDPOINT_URL,
      headers,
      5000,          // timeout ms
      bodyArr,
      responseArr,
      responseHeaders
   );

   string responseBody = CharArrayToString(responseArr);

   if (httpCode == 200 || httpCode == 201) {
      Print("[SneakerheadSync] ✓ Trade ", ticket, " synced → Notion | ", responseBody);
      MarkSent(ticket);
   } else {
      Print("[SneakerheadSync] ✗ HTTP ", httpCode, " for ticket ", ticket, " | ", responseBody);
   }
}

//─── EA events ───────────────────────────────────────────────────────────────

int OnInit() {
   ArrayResize(g_sentTickets, 0);
   Print("[SneakerheadSync] Started. Endpoint: ", ENDPOINT_URL);

   // Validate config
   if (StringFind(ENDPOINT_URL, "YOUR-APP") >= 0)
      Print("[SneakerheadSync] ⚠ Update ENDPOINT_URL in EA inputs!");
   if (StringFind(API_SECRET, "YOUR_MT5") >= 0)
      Print("[SneakerheadSync] ⚠ Update API_SECRET in EA inputs!");

   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) {
   Print("[SneakerheadSync] Stopped. Reason: ", reason);
}

// Called on every trade event — filters for position close
void OnTradeTransaction(
   const MqlTradeTransaction& trans,
   const MqlTradeRequest&     request,
   const MqlTradeResult&      result
) {
   // We only care about deal additions (a deal = actual execution)
   if (trans.type != TRADE_TRANSACTION_DEAL_ADD) return;
   // Ensure history is loaded for this deal
   HistorySelect(TimeCurrent() - 86400 * 7, TimeCurrent());
   SendTrade(trans);
}

// Keep EA alive
void OnTick() {}
