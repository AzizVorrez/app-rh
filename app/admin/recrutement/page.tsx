import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

// La page recrutement rend le layout admin principal avec la vue Recrutement active.
export default function AdminRecrutementPage() {
  return <AdminDashboard initialView="recrutement" />;
}
