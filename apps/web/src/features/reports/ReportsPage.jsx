import { ArrowDownToLine, CalendarDays, ChevronDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { displayMoney } from "../../shared/formatters.js";
import { PageHeading } from "../../components/PageHeading.jsx";
export function ReportsPage({
  reportData,
  loading
}) {
  const projects = reportData?.projects?.rows || [];
  const finance = reportData?.finance?.rows || [];
  const attendance = reportData?.attendance?.rows || [];
  const payments = finance.filter(record => record.recordType === "payment");
  const revenueByMonth = Object.entries(payments.reduce((groups, payment) => {
    const paidAt = payment.paidAt || payment.createdAt;
    if (!paidAt) return groups;
    const date = new Date(paidAt);
    if (Number.isNaN(date.getTime())) return groups;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    groups[key] ||= {
      month: date.toLocaleDateString(undefined, {
        month: "short"
      }),
      revenue: 0
    };
    groups[key].revenue += Number(payment.amountReceived) || 0;
    return groups;
  }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([, monthData]) => monthData);
  const completion = projects.length ? projects.reduce((total, project) => total + (Number(project.progress) || 0), 0) / projects.length : 0;
  const totalCheckIns = attendance.reduce((total, item) => total + (Number(item.checkIns) || 0), 0);
  const completedShifts = attendance.reduce((total, item) => total + (Number(item.completedShifts) || 0), 0);
  const revenue = payments.reduce((total, item) => total + (Number(item.amountReceived) || 0), 0);
  return <>
      <PageHeading title="Reports & analytics" description="See project delivery, workforce coverage, and financial performance." action={<button className="button button-secondary">
            <CalendarDays size={16} />
            Oct 01 – Oct 16
            <ChevronDown size={14} />
          </button>} />
      <div className="report-grid">
        <div className="panel report-card">
          <span>Project completion</span>
          <strong>{completion.toFixed(1)}%</strong>
          <small>{projects.length} projects in the database</small>
          <div className="report-bar">
            <span style={{
            width: `${Math.min(100, completion)}%`
          }} />
          </div>
        </div>
        <div className="panel report-card">
          <span>Completed shifts</span>
          <strong>{totalCheckIns ? `${Math.round(completedShifts / totalCheckIns * 100)}%` : "0%"}</strong>
          <small>{completedShifts} of {totalCheckIns} recorded check-ins completed</small>
          <div className="report-bar green-bar">
            <span style={{
            width: `${totalCheckIns ? Math.min(100, completedShifts / totalCheckIns * 100) : 0}%`
          }} />
          </div>
        </div>
        <div className="panel report-card">
          <span>Revenue collected</span>
          <strong>{displayMoney(revenue)}</strong>
          <small>{payments.length} recorded payment transactions</small>
          <div className="report-bar blue-bar">
            <span style={{
            width: `${revenue ? 100 : 0}%`
          }} />
          </div>
        </div>
      </div>
      <div className="panel report-chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Revenue trend</h2>
            <p>Monthly recognized revenue · USD</p>
          </div>
          <button className="button button-secondary">
            <ArrowDownToLine size={16} />
            Export report
          </button>
        </div>
        <div className="chart-area report-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueByMonth}>
              <defs>
                <linearGradient id="reportFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e87524" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#e87524" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e9eeec" strokeDasharray="3 4" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{
              fill: "#8a9697",
              fontSize: 11
            }} tickMargin={12} />
              <YAxis axisLine={false} tickLine={false} tick={{
              fill: "#8a9697",
              fontSize: 10
            }} tickFormatter={value => `$${Math.round(value / 1000)}k`} />
              <Tooltip formatter={value => [displayMoney(value), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#e87524" strokeWidth={2.5} fill="url(#reportFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {!loading && !reportData && <p className="empty-state">No report data is available.</p>}
      </div>
    </>;
}
