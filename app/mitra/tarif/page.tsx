import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import AturTarifForm from "./AturTarifForm";

async function getTarifData(uid: string) {
  const [catsRes, svcsRes, skillsRes] = await Promise.all([
    pool.query(
      `SELECT id, name, description, emoji FROM categories WHERE is_active=true ORDER BY display_order`
    ),
    pool.query(
      `SELECT category_id, rate_per_hour, is_active FROM partner_services WHERE partner_uid=$1`,
      [uid]
    ),
    pool.query(
      `SELECT DISTINCT category_id, skill_name FROM partner_skills WHERE partner_uid=$1`,
      [uid]
    ),
  ]);

  const skillsByCategory: Record<string, string[]> = {};
  for (const r of skillsRes.rows) {
    if (!skillsByCategory[r.category_id]) skillsByCategory[r.category_id] = [];
    skillsByCategory[r.category_id].push(r.skill_name);
  }

  const svcMap: Record<string, { rate: number; active: boolean }> = {};
  for (const r of svcsRes.rows) {
    svcMap[r.category_id] = { rate: r.rate_per_hour, active: r.is_active };
  }

  const services = catsRes.rows.map((cat) => ({
    categoryId: cat.id,
    name: cat.name,
    description: cat.description,
    emoji: cat.emoji,
    rate: svcMap[cat.id]?.rate ?? 50000,
    skills: skillsByCategory[cat.id] ?? [],
    active: svcMap[cat.id]?.active ?? false,
  }));

  return { services };
}

export default async function AturTarifPage() {
  const session = await getSession();
  if (!session || session.role !== "partner") redirect("/");

  const data = await getTarifData(session.uid);

  return <AturTarifForm initialServices={data.services} />;
}
