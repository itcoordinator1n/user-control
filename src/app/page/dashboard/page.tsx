import DashboardReports from "@/components/dashboard-reports"
import AttendanceDashboard from "./attendance-dashboard"

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      {/*<DashboardReports /> */}
      <AttendanceDashboard/>
    </main>
  )
}

