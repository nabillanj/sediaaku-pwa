import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { listCategories } from "@/lib/actions/partner";
import pool from "@/lib/db";
import EditMitraProfilForm from "./EditMitraProfilForm";

async function getMitraFullData(uid: string) {
  const [mitraRes, servicesRes, skillsRes] = await Promise.all([
    pool.query(
      `SELECT name, city, domicile_detail, gender,
              TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
              bio, ktp_url, selfie_url, domisili_doc_url, verify_status, photo_url
       FROM partners WHERE uid=$1`,
      [uid]
    ),
    pool.query(
      `SELECT category_id, rate_per_hour FROM partner_services
       WHERE partner_uid=$1 AND is_active=true`,
      [uid]
    ),
    pool.query(
      `SELECT category_id, skill_name FROM partner_skills WHERE partner_uid=$1`,
      [uid]
    ),
  ]);

  const mitra = mitraRes.rows[0];
  if (!mitra) return null;

  const skillsByCategory: Record<string, string[]> = {};
  for (const row of skillsRes.rows) {
    if (!skillsByCategory[row.category_id]) skillsByCategory[row.category_id] = [];
    skillsByCategory[row.category_id].push(row.skill_name);
  }

  const services = servicesRes.rows.map((r) => ({
    categoryId: r.category_id,
    ratePerHour: r.rate_per_hour,
    skills: skillsByCategory[r.category_id] ?? [],
  }));

  return { mitra, services };
}

export default async function EditMitraProfilPage() {
  const session = await getSession();
  if (!session || session.role !== "partner") redirect("/");

  const [result, categories] = await Promise.all([
    getMitraFullData(session.uid),
    listCategories(),
  ]);

  if (!result) redirect("/mitra/profil");

  const { mitra, services } = result;

  return (
    <EditMitraProfilForm
      initialData={{
        name: mitra.name ?? "",
        city: mitra.city ?? "",
        domicileDetail: mitra.domicile_detail ?? "",
        gender: mitra.gender ?? "",
        birthDate: mitra.birth_date ?? "",
        bio: mitra.bio ?? "",
        ktpUrl: mitra.ktp_url ?? "",
        selfieUrl: mitra.selfie_url ?? "",
        domisiliDocUrl: mitra.domisili_doc_url ?? "",
        verifyStatus: mitra.verify_status ?? "",
        photoUrl: mitra.photo_url ?? "",
      }}
      initialServices={services}
      categories={categories}
    />
  );
}
