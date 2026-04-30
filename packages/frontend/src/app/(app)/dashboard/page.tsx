import { Topbar } from "@/components/shared/Topbar";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { RecentQuotes } from "@/components/dashboard/RecentQuotes";
import { RiskAlerts } from "@/components/dashboard/RiskAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Dashboard" action={{ label: "+ Nuovo preventivo", href: "/preventivi/nuovo" }} />
      <div className="p-8 space-y-8">
        <KpiGrid />
        <div className="grid grid-cols-[1fr_380px] gap-5">
          <RecentQuotes />
          <div className="space-y-5">
            <QuickActions />
            <RiskAlerts />
          </div>
        </div>
      </div>
    </>
  );
}
