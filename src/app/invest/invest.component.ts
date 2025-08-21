import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ng2-charts v8（standalone）：用 BaseChartDirective + provideCharts(withDefaultRegisterables())
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

type Row = {
  ym: string;              // YYYY-MM
  close: number;           // 模擬/自訂價格
  contribution: number;    // 每月扣款（含手續費）
  fee: number;             // 手續費
  buyShares: number;       // 買到股數
  totalShares: number;     // 累積持股
  dividend: number;        // 當月股利
  holdingValue: number;    // 市值
  cash: number;            // 現金（零頭+未再投入股利）
  totalValue: number;      // 資產總額
  date: Date;
};

@Component({
  selector: 'app-invest',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './invest.component.html',
  styleUrls: ['./invest.component.css'],
})
export class InvestComponent {
  // ====== 參數（可調）======
  monthly = 10000;            // 每月投入（含手續費）
  months = 60;               // 投資月數
  startPrice = 50;          // 起始價
  cagrPct = 7;               // 假設標的年化漲幅（用來產生價格軌跡）
  divYieldPct = 2;           // 年化殖利率（平均分攤到每月）
  feeRatePct = 0.1425;       // 買進手續費率（%）
  feeMin = 20;               // 最低手續費
  allowFraction = true;      // 允許零股
  reinvestDiv = true;        // 股利自動再投入

  // ====== 結果資料 ======
  rows: Row[] = [];
  invested = 0;
  finalValue = 0;
  pnl = 0;
  pnlRate = 0;
  avgCost = 0;
  totalShares = 0;
  irr: number | null = null;
  maxDD = 0;

  // ====== 圖表 ======
  chartType: ChartType = 'line';
  chartData: ChartConfiguration['data'] = { labels: [], datasets: [{ data: [], label: '資產總額', tension: 0.15 }] };
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    animation: false,
    plugins: { legend: { display: false } },
    scales: { y: { ticks: { callback: (v: any) => Number(v).toLocaleString('zh-TW') } } },
  };

  // ====== 執行 ======
  run() {
    const feeRate = this.feeRatePct / 100;
    const mGrow = Math.pow(1 + this.cagrPct / 100, 1 / 12) - 1; // 月成長率
    const mDiv = this.divYieldPct / 100 / 12;                    // 月殖利率（簡化）

    // 產生每月日期 & 價格、配息
    const start = new Date();
    start.setMonth(start.getMonth() - (this.months - 1)); // 回推 months-1 個月
    let price = this.startPrice;

    const series: { date: Date; close: number; divPerShare: number }[] = [];
    for (let i = 0; i < this.months; i++) {
      if (i > 0) price *= (1 + mGrow);
      const d = new Date(start.getFullYear(), start.getMonth() + i, 5); // 每月 5 號
      series.push({ date: d, close: price, divPerShare: price * mDiv });
    }

    // DCA 計算
    const rows: Row[] = [];
    let totalShares = 0;
    let cash = 0;
    let invested = 0;

    // IRR 現金流（XIRR）：每月扣款為負，若不再投入股利則為正；期末「不自動賣出」，因為持有值已體現在資產（年化率以 IRR 算）
    const cashflows: { date: Date; amount: number }[] = [];

    for (const m of series) {
      const fee = Math.max(this.feeMin, this.monthly * feeRate);
      const investable = Math.max(0, this.monthly - fee);
      const unit = this.allowFraction ? investable / m.close : Math.floor(investable / m.close);
      const used = unit * m.close;
      const leftover = investable - used;

      totalShares += unit;
      invested += this.monthly;
      cash += leftover;
      cashflows.push({ date: m.date, amount: -this.monthly });

      // 當月領股利（以「月末持股」估算）
      const dividend = totalShares * m.divPerShare;
      cash += dividend;

      // 再投入（用當月價，收一次手續費）
      if (this.reinvestDiv && dividend > 0) {
        const fee2 = Math.max(this.feeMin, cash * feeRate);
        const buyable = Math.max(0, cash - fee2);
        const add = this.allowFraction ? buyable / m.close : Math.floor(buyable / m.close);
        const used2 = add * m.close;
        totalShares += add;
        cash -= (fee2 + used2);
      } else if (dividend > 0) {
        // 不再投入 → 視為正向現金流
        cashflows.push({ date: m.date, amount: dividend });
      }

      const holdingValue = totalShares * m.close;
      const totalValue = holdingValue + cash;

      rows.push({
        ym: `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, '0')}`,
        close: round(m.close, 2),
        contribution: this.monthly,
        fee: round(fee, 2),
        buyShares: round(unit, 6),
        totalShares: round(totalShares, 6),
        dividend: round(dividend, 2),
        holdingValue: round(holdingValue, 0),
        cash: round(cash, 0),
        totalValue: round(totalValue, 0),
        date: m.date,
      });
    }

    // KPI
    const last = rows.at(-1)!;
    const finalValue = last.totalValue;
    const pnl = finalValue - invested;
    const pnlRate = invested ? pnl / invested : 0;
    const avgCost = rows.length && totalShares > 0 ? invested / totalShares : 0;

    // IRR（年化報酬率）
    const irr = xirr(cashflows, finalValue); // 把期末資產視為「持有中的淨值」→ 以「估值入帳」的方式算 IRR
    const curve = rows.map((r) => r.totalValue);
    const maxDD = maxDrawdown(curve);

    // 存到狀態
    this.rows = rows;
    this.invested = Math.round(invested);
    this.finalValue = Math.round(finalValue);
    this.pnl = Math.round(pnl);
    this.pnlRate = pnlRate;
    this.avgCost = avgCost;
    this.totalShares = totalShares;
    this.irr = irr;
    this.maxDD = maxDD;

    // 畫圖
    this.chartData = {
      labels: rows.map((r) => r.ym),
      datasets: [{ data: rows.map((r) => r.totalValue), label: '資產總額', tension: 0.15 }],
    };
  }
}

/** ========= 小工具 ========= */
function round(n: number, d = 2) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

function maxDrawdown(series: number[]) {
  let peak = -Infinity, maxDD = 0;
  for (const v of series) {
    peak = Math.max(peak, v);
    if (peak > 0) maxDD = Math.min(maxDD, (v - peak) / peak);
  }
  return Math.abs(maxDD);
}

/** XIRR：Newton-Raphson；期末「估值入帳」：在最後一筆日期加上 +finalValue 的現金流 */
function xirr(flows: { date: Date; amount: number }[], finalValue: number): number | null {
  if (!flows.length) return null;
  const lastDate = flows[flows.length - 1].date;
  const cf = [...flows, { date: lastDate, amount: finalValue }];

  const t0 = cf[0].date.getTime();
  const days = (d: Date) => (d.getTime() - t0) / 86_400_000;

  const f = (r: number) => cf.reduce((acc, c) => acc + c.amount / Math.pow(1 + r, days(c.date) / 365), 0);
  const df = (r: number) => cf.reduce(
    (acc, c) => acc - (days(c.date) / 365) * c.amount / Math.pow(1 + r, days(c.date) / 365 + 1), 0
  );

  let r = 0.1;
  for (let i = 0; i < 100; i++) {
    const y = f(r), dy = df(r);
    if (Math.abs(y) < 1e-8) return r;
    if (dy === 0) break;
    r = r - y / dy;
    if (!Number.isFinite(r)) break;
  }
  return null;
}
