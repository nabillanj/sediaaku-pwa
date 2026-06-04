import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { listCategories } from "@/lib/actions/partner";
import { AppBar } from "@/components/AppBar";
import { TabBar } from "@/components/TabBar";
import Link from "next/link";

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const categories = await listCategories();

  return (
    <div className="pwa-shell">
      <AppBar title="Semua Kategori" />

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 8 }}>
        <div style={{ padding: "8px 22px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.id}`} style={{ textDecoration: "none" }}>
              <div className="card" style={{
                borderRadius: 18, padding: 16, minHeight: 130,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                cursor: "pointer",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 13,
                  background: "var(--primary-50)", boxShadow: "0 1px 3px rgba(15,31,29,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>
                  {cat.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.4 }}>{cat.description}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <TabBar active="home" />
    </div>
  );
}
