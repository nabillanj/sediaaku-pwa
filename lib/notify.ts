import webpush from "web-push";
import pool from "@/lib/db";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface NotifyPayload {
  uid: string;
  title: string;
  body: string;
  type?: string;
  orderId?: string;
  url?: string;
}

export async function notify(payload: NotifyPayload) {
  const { uid, title, body, type = "general", orderId, url } = payload;

  // simpan in-app notif
  await pool.query(
    `INSERT INTO notifications (uid, title, body, type, order_id, url)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uid, title, body, type, orderId ?? null, url ?? null]
  );

  // kirim push ke semua subscription user
  const { rows } = await pool.query(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE uid = $1`,
    [uid]
  );

  const pushPayload = JSON.stringify({ title, body, url: url ?? "/" });

  await Promise.allSettled(
    rows.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          pushPayload
        );
      } catch (err: unknown) {
        // subscription kadaluarsa / tidak valid → hapus
        if (err && typeof err === "object" && "statusCode" in err &&
            (err.statusCode === 410 || err.statusCode === 404)) {
          await pool.query(
            `DELETE FROM push_subscriptions WHERE uid = $1 AND endpoint = $2`,
            [uid, sub.endpoint]
          );
        }
      }
    })
  );
}
