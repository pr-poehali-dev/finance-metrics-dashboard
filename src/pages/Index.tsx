import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
} from 'recharts';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  OPERATIONS_DATA, DOC_TYPE_LIST, MODEL_LIST, PROJECT_LIST, type Operation,
} from '@/data/operations';

const CHART_COLORS = [
  'hsl(156 100% 50%)', 'hsl(188 95% 55%)', 'hsl(270 90% 65%)',
  'hsl(38 95% 58%)', 'hsl(340 85% 62%)', 'hsl(210 90% 60%)',
];

const RANGES = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: '60 дней', days: 60 },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);
const fmtMoney = (n: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(n) + ' ₽';

const TODAY = new Date('2026-06-15');
function daysAgo(n: number) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function Index() {
  const [rangeDays, setRangeDays] = useState(30);
  const [project, setProject] = useState<string>('all');
  const [docType, setDocType] = useState<string>('all');
  const [model, setModel] = useState<string>('all');

  const from = daysAgo(rangeDays - 1);

  const filtered = useMemo(() =>
    OPERATIONS_DATA.filter(o =>
      o.date >= from &&
      (project === 'all' || o.project === project) &&
      (docType === 'all' || o.docType === docType) &&
      (model === 'all' || o.model === model)
    ), [from, project, docType, model]);

  const prevFrom = daysAgo(rangeDays * 2 - 1);
  const prevTo = daysAgo(rangeDays);
  const prevFiltered = useMemo(() =>
    OPERATIONS_DATA.filter(o =>
      o.date >= prevFrom && o.date <= prevTo &&
      (project === 'all' || o.project === project) &&
      (docType === 'all' || o.docType === docType) &&
      (model === 'all' || o.model === model)
    ), [prevFrom, prevTo, project, docType, model]);

  const total = filtered.reduce((s, o) => s + o.cost, 0);
  const prevTotal = prevFiltered.reduce((s, o) => s + o.cost, 0);
  const growth = prevTotal ? ((total - prevTotal) / prevTotal) * 100 : 0;
  const avgPerOp = filtered.length ? total / filtered.length : 0;
  const avgPerDay = total / rangeDays;

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = rangeDays - 1; i >= 0; i--) map.set(daysAgo(i), 0);
    filtered.forEach(o => map.set(o.date, (map.get(o.date) || 0) + o.cost));
    return Array.from(map.entries()).map(([date, cost]) => ({
      date: date.slice(5).replace('-', '.'),
      cost: +cost.toFixed(1),
    }));
  }, [filtered, rangeDays]);

  const topDocs = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(o => map.set(o.docType, (map.get(o.docType) || 0) + o.cost));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: +value.toFixed(1) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filtered]);

  const byModel = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(o => map.set(o.model, (map.get(o.model) || 0) + o.cost));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: +value.toFixed(1) }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const exportCSV = () => {
    const headers = ['ФИО', 'GUID', 'Дата процедуры', 'ИИ операция', 'Тип документа', 'Модель ИИ', 'Проект', 'Стоимость ₽'];
    const rows = filtered.map(o =>
      [o.fio, o.guid, o.date, o.operation, o.docType, o.model, o.project, o.cost].join(';')
    );
    const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-costs-${from}_${daysAgo(0)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tableRows = filtered.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 md:py-9">

        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 glow-primary">
              <Icon name="ScanLine" className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Расходы на OCR</h1>
              <p className="text-sm text-muted-foreground">Аналитика затрат на ИИ-распознавание документов</p>
            </div>
          </div>
          <Button onClick={exportCSV} className="gap-2 font-medium">
            <Icon name="Download" size={18} /> Экспорт CSV
          </Button>
        </header>

        <div className="mt-7 flex flex-wrap items-center gap-2 animate-fade-in">
          <div className="flex rounded-lg border border-border bg-card p-1">
            {RANGES.map(r => (
              <button
                key={r.days}
                onClick={() => setRangeDays(r.days)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  rangeDays === r.days
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <FilterSelect icon="Folder" value={project} onChange={setProject}
            placeholder="Проект" all="Все проекты" options={PROJECT_LIST as unknown as string[]} />
          <FilterSelect icon="FileText" value={docType} onChange={setDocType}
            placeholder="Тип документа" all="Все типы" options={DOC_TYPE_LIST} />
          <FilterSelect icon="Cpu" value={model} onChange={setModel}
            placeholder="Модель ИИ" all="Все модели" options={MODEL_LIST} />

          <span className="ml-auto text-sm text-muted-foreground">
            Операций: <span className="font-mono font-semibold text-foreground">{fmt(filtered.length)}</span>
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon="Wallet" label="Общие расходы" value={fmtMoney(total)}
            sub={`за ${rangeDays} дн.`} accent />
          <Kpi icon="TrendingUp" label="Динамика к пред. периоду"
            value={`${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`}
            sub={`было ${fmtMoney(prevTotal)}`} trend={growth >= 0 ? 'up' : 'down'} />
          <Kpi icon="Receipt" label="Средний чек операции" value={fmtMoney(avgPerOp)}
            sub={`${fmt(filtered.length)} операций`} />
          <Kpi icon="CalendarDays" label="Средние расходы в день" value={fmtMoney(avgPerDay)}
            sub="по периоду" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="glass-card rounded-2xl p-5 lg:col-span-2 animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-semibold">Динамика расходов по дням</h3>
              <Icon name="Activity" className="text-primary" size={18} />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={byDay} margin={{ left: -18, right: 8, top: 5 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(156 100% 50%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(156 100% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 24% 18%)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'hsl(217 15% 60%)', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tick={{ fill: 'hsl(217 15% 60%)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <RTooltip content={<ChartTooltip suffix=" ₽" />} />
                <Area type="monotone" dataKey="cost" stroke="hsl(156 100% 50%)" strokeWidth={2.5} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-2xl p-5 animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display font-semibold">Расходы по моделям ИИ</h3>
              <Icon name="Cpu" className="text-accent" size={18} />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byModel} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={48} outerRadius={80} paddingAngle={3} stroke="none">
                  {byModel.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <RTooltip content={<ChartTooltip suffix=" ₽" />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {byModel.map((m, i) => (
                <div key={m.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{m.name}</span>
                  <span className="ml-auto font-mono text-foreground">{fmtMoney(m.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 glass-card rounded-2xl p-5 animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold">Топ-5 статей затрат по типам документов</h3>
            <Icon name="Trophy" className="text-chart-4" size={18} />
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={topDocs} layout="vertical" margin={{ left: 28, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 24% 18%)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'hsl(217 15% 60%)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fill: 'hsl(210 40% 98%)', fontSize: 12 }} tickLine={false} axisLine={false} />
              <RTooltip content={<ChartTooltip suffix=" ₽" />} cursor={{ fill: 'hsl(222 24% 16% / 0.5)' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                {topDocs.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 glass-card rounded-2xl animate-fade-in">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="font-display font-semibold">Детализация операций</h3>
            <span className="text-sm text-muted-foreground">показаны последние 50</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <Th>ФИО</Th><Th>GUID</Th><Th>Дата</Th><Th>ИИ операция</Th>
                  <Th>Тип документа</Th><Th>Модель ИИ</Th><Th>Проект</Th><Th className="text-right">Стоимость</Th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((o: Operation) => (
                  <tr key={o.id} className="border-b border-border/50 transition hover:bg-secondary/40">
                    <td className="px-4 py-2.5 font-medium">{o.fio}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{o.guid.slice(0, 13)}…</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{o.date}</td>
                    <td className="px-4 py-2.5">{o.operation}</td>
                    <td className="px-4 py-2.5">{o.docType}</td>
                    <td className="px-4 py-2.5">{o.model}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        o.project === 'BFLsoft' ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'
                      }`}>{o.project}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">{o.cost.toFixed(2)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ icon, value, onChange, placeholder, all, options }: {
  icon: string; value: string; onChange: (v: string) => void;
  placeholder: string; all: string; options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto gap-2 bg-card">
        <Icon name={icon} size={15} className="text-muted-foreground" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function Kpi({ icon, label, value, sub, accent, trend }: {
  icon: string; label: string; value: string; sub: string;
  accent?: boolean; trend?: 'up' | 'down';
}) {
  return (
    <div className={`glass-card rounded-2xl p-5 animate-fade-in ${accent ? 'glow-primary' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon name={icon} size={18} className={accent ? 'text-primary' : 'text-muted-foreground'} />
      </div>
      <div className={`mt-3 font-display text-2xl font-bold tabular ${
        trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-destructive' : ''
      }`}>{value}</div>
      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        {trend && <Icon name={trend === 'up' ? 'ArrowUpRight' : 'ArrowDownRight'} size={13} />}
        {sub}
      </div>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

interface TooltipItem {
  name?: string | number;
  value?: string | number;
  color?: string;
  payload?: { fill?: string };
}
interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  suffix?: string;
}

function ChartTooltip({ active, payload, label, suffix = '' }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-xl">
      {label && <div className="mb-1 font-medium">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 font-mono">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          {p.name}: <span className="font-semibold">{p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
}