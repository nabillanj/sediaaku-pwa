import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getAnnouncementsForUser } from "@/lib/actions/announcements";
import { AppBar } from "@/components/AppBar";
import pool from "@/lib/db";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const role = (session as { role?: string }).role === "partner" ? "partner" : "user";

  const [announcements, { rows: notifRows }] = await Promise.all([
    getAnnouncementsForUser(session.uid, role),
    pool.query(
      `SELECT id, title, body, type, order_id, url, is_read, created_at
       FROM notifications WHERE uid = $1 ORDER BY created_at DESC LIMIT 50`,
      [session.uid]
    ),
  ]);

  return (
    <div className="pwa-shell">
      <AppBar title="Notifikasi" />
      <NotificationsClient
        announcements={announcements}
        notifications={notifRows}
        uid={session.uid}
      />
    </div>
  );
}
