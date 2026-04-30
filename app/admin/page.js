import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Evaluación Claude AI | ALZAK Foundation",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
