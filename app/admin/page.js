import { notFound } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-session";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Evaluación Claude AI | ALZAK Foundation",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const ok = await isAdminAuthenticated();
  if (!ok) notFound();
  return <AdminDashboard />;
}
