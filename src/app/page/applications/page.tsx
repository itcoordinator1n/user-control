import type { Metadata } from "next"
import DashboardLayout from "@/components/dashboard-layout"
import RequestsTable from "@/components/requests-table"
import SupervisorDashboard from "./components/supervisor-dashboard"

export const metadata: Metadata = {
  title: "Supervisor Dashboard - Leave Request Approval",
  description: "Manage employee leave and vacation requests",
}

export default function ApplicationsPage() {
  return (
      <SupervisorDashboard />
  )
}