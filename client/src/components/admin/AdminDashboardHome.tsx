import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  User,
  UserCheck,
  Flag,
  FileText,
  Settings,
  AlertTriangle,
  Clock,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";

interface AdminStats {
  pendingApprovals: number;
  totalPsychiatrists: number;
  totalPatients: number;
}

interface DashboardCard {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  iconBg: string;
  iconColor: string;
  metric?: number | null;
  metricLabel?: string;
}

export default function AdminDashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [pendingRes, psychiatristsRes, patientsRes] = await Promise.all([
          api.get("/admin/psychiatrists/pending"),
          api.get("/admin/psychiatrists"),
          api.get("/admin/patients"),
        ]);
        if (cancelled) return;
        setStats({
          pendingApprovals: pendingRes.data?.data?.length ?? 0,
          totalPsychiatrists: psychiatristsRes.data?.data?.length ?? 0,
          totalPatients: patientsRes.data?.data?.length ?? 0,
        });
        setError(null);
      } catch (err) {
        if (!cancelled) {
          console.error("[admin-home] failed to load stats", err);
          setError("Could not load live statistics. Showing cards without counts.");
          setStats({ pendingApprovals: 0, totalPsychiatrists: 0, totalPatients: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const navigateTo = (id: string) => {
    window.dispatchEvent(new CustomEvent("navItemClick", { detail: { navItem: id } }));
    navigate(`/admin/dashboard?tab=${id}`, { replace: true });
  };

  if (!user) return null;

  const cards: DashboardCard[] = [
    {
      id: "approvals",
      icon: CheckCircle,
      title: "Psychiatrist Approvals",
      description: "Review applications and verify credentials.",
      accent: "border-blue-500",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      metric: stats?.pendingApprovals ?? null,
      metricLabel: "pending",
    },
    {
      id: "all-users",
      icon: User,
      title: "Patients",
      description: "Browse, search, and manage patient accounts.",
      accent: "border-emerald-500",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      metric: stats?.totalPatients ?? null,
      metricLabel: "total",
    },
    {
      id: "all-psychiatrists",
      icon: UserCheck,
      title: "Psychiatrists",
      description: "Approved providers and onboarding status.",
      accent: "border-violet-500",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      metric: stats?.totalPsychiatrists ?? null,
      metricLabel: "total",
    },
    {
      id: "reports",
      icon: Flag,
      title: "Reports",
      description: "Audit assessments and learning-plan history.",
      accent: "border-amber-500",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      id: "tests",
      icon: FileText,
      title: "Tests",
      description: "Configure assessment templates and rubrics.",
      accent: "border-rose-500",
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      id: "settings",
      icon: Settings,
      title: "System Settings",
      description: "Notifications, retention, and security policies.",
      accent: "border-slate-500",
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 border-b border-slate-200 pb-6"
      >
        <p className="text-sm font-medium text-slate-500">Admin console</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Welcome back, {user.name}
        </h1>
        <p className="text-slate-600">
          Here's an at-a-glance view of the NeuroAssess platform.
        </p>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile
          label="Pending approvals"
          value={stats?.pendingApprovals}
          loading={loading}
          tone="amber"
          icon={AlertTriangle}
          onClick={() => navigateTo("approvals")}
        />
        <KpiTile
          label="Approved psychiatrists"
          value={stats?.totalPsychiatrists}
          loading={loading}
          tone="violet"
          icon={UserCheck}
          onClick={() => navigateTo("all-psychiatrists")}
        />
        <KpiTile
          label="Registered patients"
          value={stats?.totalPatients}
          loading={loading}
          tone="emerald"
          icon={User}
          onClick={() => navigateTo("all-users")}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {error}
        </div>
      )}

      {/* Module cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Modules</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <motion.button
              type="button"
              key={card.id}
              onClick={() => navigateTo(card.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className={`group flex flex-col items-start gap-3 rounded-xl border-l-4 ${card.accent} bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
            >
              <div className="flex w-full items-start justify-between gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}
                  aria-hidden="true"
                >
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </span>
                {card.metric !== undefined && card.metric !== null && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {loading ? "…" : `${card.metric} ${card.metricLabel ?? ""}`}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {card.title}
              </h3>
              <p className="text-sm text-slate-600">{card.description}</p>
              <span className="mt-auto pt-1 text-xs font-medium text-blue-600 group-hover:text-blue-700">
                Open →
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Activity hint */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-start gap-4 rounded-xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 text-slate-300" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">Approvals queue</h2>
            <p className="mt-1 text-sm text-slate-300">
              {loading
                ? "Loading queue…"
                : stats?.pendingApprovals
                ? `${stats.pendingApprovals} psychiatrist application${
                    stats.pendingApprovals === 1 ? "" : "s"
                  } awaiting your review.`
                : "Nothing pending. Great work."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigateTo("approvals")}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          Review approvals
        </button>
      </motion.div>
    </div>
  );
}

interface KpiTileProps {
  label: string;
  value: number | undefined;
  loading: boolean;
  tone: "amber" | "violet" | "emerald";
  icon: LucideIcon;
  onClick: () => void;
}

const TONE_CLASSES: Record<KpiTileProps["tone"], { bg: string; fg: string; ring: string }> = {
  amber: { bg: "bg-amber-50", fg: "text-amber-700", ring: "ring-amber-100" },
  violet: { bg: "bg-violet-50", fg: "text-violet-700", ring: "ring-violet-100" },
  emerald: { bg: "bg-emerald-50", fg: "text-emerald-700", ring: "ring-emerald-100" },
};

function KpiTile({ label, value, loading, tone, icon: Icon, onClick }: KpiTileProps) {
  const c = TONE_CLASSES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {loading ? (
          <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-200" />
        ) : (
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {value ?? 0}
          </p>
        )}
      </div>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full ${c.bg} ${c.fg} ring-1 ${c.ring}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </span>
    </button>
  );
}
