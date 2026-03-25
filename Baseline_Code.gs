// BASELINE LIFE PLANNER — Google Apps Script (v2 — daily Net Worth log)
// Paste into Tools > Script Editor in your Baseline Google Sheet
// Deploy > New Deployment > Web App > Execute as Me > Anyone > Deploy

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dash  = ss.getSheetByName('🏠 Dashboard');
  const daily = ss.getSheetByName('📅 Daily Log');
  const income= ss.getSheetByName('💰 Income Log');
  const bills = ss.getSheetByName('💳 Bill Tracker');
  const nw    = ss.getSheetByName('📈 Net Worth');

  // ── DASHBOARD INPUTS ────────────────────────────────────────────────────────
  const earned        = dash.getRange('B7').getValue() || 0;
  const currentWeight = dash.getRange('B8').getValue() || 202.4;
  const weightGoal    = dash.getRange('B9').getValue() || 170;
  const weeksLeft     = dash.getRange('B13').getValue() || 40;

  // ── WEIGHT LOG ──────────────────────────────────────────────────────────────
  const weightLog = [];
  let lastWeight = currentWeight;
  if (dash) {
    for (let r = 22; r <= 61; r++) {
      const w = dash.getRange(r, 2).getValue();
      if (w && w > 0) weightLog.push(parseFloat(w));
    }
    if (weightLog.length >= 2) lastWeight = weightLog[weightLog.length - 2];
  }

  // ── DAILY LOG ───────────────────────────────────────────────────────────────
  const recentHabits = [];
  let meditationDays = 0;
  if (daily) {
    for (let r = 5; r <= 32; r++) {
      const dateVal = daily.getRange(r, 1).getDisplayValue();
      const med = (daily.getRange(r, 3).getValue() || '').toString().toUpperCase();
      const rev = (daily.getRange(r, 4).getValue() || '').toString().toUpperCase();
      recentHabits.push({ date: dateVal, med, rev });
    }
    const allMed = daily.getRange('C5:C287').getValues();
    meditationDays = allMed.filter(r => r[0].toString().toUpperCase() === 'Y').length;
  }

  // ── INCOME LOG ──────────────────────────────────────────────────────────────
  const bizTotals = [];
  const bizNames  = [];
  const monthlyIncome = Array(12).fill(0);
  if (income) {
    for (let row = 5; row <= 10; row++) {
      const name = income.getRange(row, 1).getValue() || '';
      bizNames.push(name);
      let rowTotal = 0;
      for (let col = 2; col <= 13; col++) {
        const val = income.getRange(row, col).getValue() || 0;
        rowTotal += val;
        monthlyIncome[col - 2] += val;
      }
      bizTotals.push(rowTotal);
    }
  }

  // ── BILL TRACKER ────────────────────────────────────────────────────────────
  let monthlyBillTotal = 0;
  let billsPaidYTD = 0;
  if (bills) {
    monthlyBillTotal = bills.getRange('B35').getValue() || 0;
    billsPaidYTD     = bills.getRange('Q35').getValue() || 0;
  }

  // ── NET WORTH — daily log ───────────────────────────────────────────────────
  const accounts = [];
  const nwTrend  = [];
  let netWorth   = 0;
  if (nw) {
    const nameRow = nw.getRange(5, 2, 1, 7).getValues()[0];
    nameRow.forEach(n => accounts.push({ name: n || '', balance: 0 }));
    const lastRow = nw.getLastRow();
    let latest = Array(7).fill(0);
    for (let r = 6; r <= lastRow; r++) {
      const vals = nw.getRange(r, 2, 1, 7).getValues()[0];
      const hasData = vals.some(v => v && v > 0);
      if (hasData) {
        vals.forEach((v, i) => { if (v > 0) latest[i] = v; });
        const total = latest.reduce((a, b) => a + b, 0);
        nwTrend.push({ date: nw.getRange(r, 1).getDisplayValue(), total });
      }
    }
    latest.forEach((b, i) => { if (accounts[i]) accounts[i].balance = b; });
    netWorth = latest.reduce((a, b) => a + b, 0);
  }

  return ContentService
    .createTextOutput(JSON.stringify({
      earned, currentWeight, lastWeight, weightGoal, weeksLeft,
      weightLog, recentHabits, meditationDays,
      bizNames, bizTotals, monthlyIncome,
      monthlyBillTotal, billsPaidYTD,
      accounts, netWorth, nwTrend,
      lastUpdated: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
