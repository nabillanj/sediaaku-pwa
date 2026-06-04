"use server";

import pool from "@/lib/db";
import { notify } from "@/lib/notify";

export type ConversationItem = {
  id: string;
  partner_uid: string | null;
  partner_name: string | null;
  partner_is_online: boolean;
  user_uid: string;
  user_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_uid: string;
  sender_role: "user" | "partner" | "admin";
  body: string;
  created_at: string;
};

export type RelatedOrder = {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  order_status: string;
};

// ── Chat list for a user ────────────────────────────────────
export async function getUserChatList(userUid: string): Promise<ConversationItem[]> {
  const { rows } = await pool.query(
    `SELECT
       c.id, c.user_uid, c.partner_uid, c.last_message, c.last_message_at,
       u.name AS user_name,
       p.name AS partner_name,
       COALESCE(p.is_online, false) AS partner_is_online,
       COALESCE((
         SELECT COUNT(*)::int FROM messages m
         WHERE m.conversation_id = c.id
           AND m.created_at > COALESCE(
             (SELECT cr.last_read_at FROM conversation_reads cr
              WHERE cr.conversation_id = c.id AND cr.uid = $1), '1970-01-01'
           )
           AND m.sender_uid != $1
       ), 0) AS unread_count
     FROM conversations c
     JOIN users u ON u.uid = c.user_uid
     LEFT JOIN partners p ON p.uid = c.partner_uid
     WHERE c.user_uid = $1
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`,
    [userUid]
  );
  return rows;
}

// ── Chat list for a mitra ────────────────────────────────────
export async function getMitraChatList(partnerUid: string): Promise<ConversationItem[]> {
  const { rows } = await pool.query(
    `SELECT
       c.id, c.user_uid, c.partner_uid, c.last_message, c.last_message_at,
       u.name AS user_name,
       p.name AS partner_name,
       COALESCE(p.is_online, false) AS partner_is_online,
       COALESCE((
         SELECT COUNT(*)::int FROM messages m
         WHERE m.conversation_id = c.id
           AND m.created_at > COALESCE(
             (SELECT cr.last_read_at FROM conversation_reads cr
              WHERE cr.conversation_id = c.id AND cr.uid = $1), '1970-01-01'
           )
           AND m.sender_uid != $1
       ), 0) AS unread_count
     FROM conversations c
     LEFT JOIN users u ON u.uid = c.user_uid AND c.partner_uid != 'sediaaku-support'
     LEFT JOIN partners p ON p.uid = c.partner_uid AND c.partner_uid != 'sediaaku-support'
     WHERE c.partner_uid = $1
        OR (c.user_uid = $1 AND c.partner_uid = 'sediaaku-support')
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`,
    [partnerUid]
  );
  return rows;
}

// ── Get or create mitra support conversation ────────────────
export async function getOrCreateMitraSupportConversation(partnerUid: string): Promise<string> {
  const existing = await pool.query(
    `SELECT id FROM conversations WHERE user_uid=$1 AND partner_uid='sediaaku-support'`,
    [partnerUid]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const { rows } = await pool.query(
    `INSERT INTO conversations (user_uid, partner_uid) VALUES ($1, 'sediaaku-support') RETURNING id`,
    [partnerUid]
  );
  const convId = rows[0].id;

  const welcome = "Halo! 👋 Selamat datang di Tim Sediaaku. Ada yang bisa kami bantu?";
  await pool.query(
    `INSERT INTO messages (conversation_id, sender_uid, sender_role, body)
     VALUES ($1, 'sediaaku-system', 'admin', $2)`,
    [convId, welcome]
  );
  await pool.query(
    `UPDATE conversations SET last_message=$1, last_message_at=NOW() WHERE id=$2`,
    [welcome.slice(0, 120), convId]
  );
  return convId;
}

// ── Get or create support conversation ──────────────────────
export async function getOrCreateSupportConversation(userUid: string): Promise<string> {
  const existing = await pool.query(
    `SELECT id FROM conversations WHERE user_uid=$1 AND partner_uid IS NULL`,
    [userUid]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const { rows } = await pool.query(
    `INSERT INTO conversations (user_uid, partner_uid) VALUES ($1, NULL) RETURNING id`,
    [userUid]
  );
  const convId = rows[0].id;

  // Auto welcome message dari Tim Sediaaku
  const welcome = "Halo! 👋 Selamat datang di Tim Sediaaku. Ada yang bisa kami bantu?";
  await pool.query(
    `INSERT INTO messages (conversation_id, sender_uid, sender_role, body)
     VALUES ($1, 'sediaaku-system', 'admin', $2)`,
    [convId, welcome]
  );
  await pool.query(
    `UPDATE conversations SET last_message=$1, last_message_at=NOW() WHERE id=$2`,
    [welcome.slice(0, 120), convId]
  );

  return convId;
}

// ── Get messages + mark read ─────────────────────────────────
export async function getMessages(conversationId: string, readerUid: string): Promise<Message[]> {
  const { rows } = await pool.query(
    `SELECT id, conversation_id, sender_uid, sender_role, body, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );
  // Mark as read
  await pool.query(
    `INSERT INTO conversation_reads (conversation_id, uid, last_read_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (conversation_id, uid) DO UPDATE SET last_read_at = NOW()`,
    [conversationId, readerUid]
  );
  return rows;
}

// ── Send a message ────────────────────────────────────────────
export async function sendMessage(
  conversationId: string,
  senderUid: string,
  senderRole: "user" | "partner" | "admin",
  body: string
): Promise<{ ok: boolean; message?: Message }> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false };

  const { rows } = await pool.query(
    `INSERT INTO messages (conversation_id, sender_uid, sender_role, body)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [conversationId, senderUid, senderRole, trimmed]
  );

  await pool.query(
    `UPDATE conversations SET last_message=$1, last_message_at=NOW() WHERE id=$2`,
    [trimmed.slice(0, 120), conversationId]
  );

  // Mark read for sender
  await pool.query(
    `INSERT INTO conversation_reads (conversation_id, uid, last_read_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (conversation_id, uid) DO UPDATE SET last_read_at = NOW()`,
    [conversationId, senderUid]
  );

  // Notify recipient
  const { rows: convRows } = await pool.query(
    `SELECT user_uid, partner_uid FROM conversations WHERE id = $1`,
    [conversationId]
  );
  if (convRows[0]) {
    const { user_uid, partner_uid } = convRows[0];
    const recipientUid = senderUid === user_uid ? partner_uid : user_uid;
    if (recipientUid && recipientUid !== "sediaaku-support") {
      const senderName = await pool.query(
        `SELECT name FROM users WHERE uid=$1 UNION SELECT name FROM partners WHERE uid=$1 LIMIT 1`,
        [senderUid]
      ).then((r) => r.rows[0]?.name ?? "Seseorang");
      await notify({
        uid: recipientUid,
        title: `Pesan dari ${senderName}`,
        body: trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed,
        type: "chat",
        url: senderRole === "user" ? `/mitra/chat/${conversationId}` : `/chat/${conversationId}`,
      }).catch(() => {});
    }
  }

  return { ok: true, message: rows[0] };
}

// ── Report a message ─────────────────────────────────────────
export async function reportMessage(
  messageId: string,
  reporterUid: string
): Promise<{ ok: boolean }> {
  try {
    await pool.query(
      `INSERT INTO message_reports (message_id, reporter_uid) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [messageId, reporterUid]
    );
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ── Get conversation by ID (with auth check) ─────────────────
export async function getConversation(conversationId: string) {
  const { rows } = await pool.query(
    `SELECT c.*,
            -- user_uid bisa berisi uid user biasa ATAU uid mitra (untuk mitra support conv)
            COALESCE(u.name, mp.name) AS user_name,
            p.name AS partner_name,
            COALESCE(p.is_online, false) AS partner_is_online
     FROM conversations c
     LEFT JOIN users u ON u.uid = c.user_uid AND c.partner_uid IS DISTINCT FROM 'sediaaku-support'
     LEFT JOIN partners mp ON mp.uid = c.user_uid AND c.partner_uid = 'sediaaku-support'
     LEFT JOIN partners p ON p.uid = c.partner_uid AND c.partner_uid IS DISTINCT FROM 'sediaaku-support'
     WHERE c.id = $1`,
    [conversationId]
  );
  return rows[0] ?? null;
}

// ── Get related order (active or most recent) ────────────────
export async function getRelatedOrder(
  userUid: string,
  partnerUid: string
): Promise<RelatedOrder | null> {
  const { rows } = await pool.query(
    `SELECT id, scheduled_date, start_time, end_time, order_status
     FROM orders
     WHERE user_uid=$1 AND partner_uid=$2
       AND order_status NOT IN ('cancelled','pending_payment')
     ORDER BY
       CASE WHEN order_status IN ('confirmed','on_the_way','arrived','in_progress') THEN 0 ELSE 1 END,
       scheduled_date DESC
     LIMIT 1`,
    [userUid, partnerUid]
  );
  return rows[0] ?? null;
}

// ── Poll: only new messages since a timestamp ─────────────────
export async function pollMessages(
  conversationId: string,
  readerUid: string,
  since: string
): Promise<Message[]> {
  const { rows } = await pool.query(
    `SELECT id, conversation_id, sender_uid, sender_role, body, created_at
     FROM messages
     WHERE conversation_id = $1 AND created_at > $2
     ORDER BY created_at ASC`,
    [conversationId, since]
  );
  if (rows.length > 0) {
    await pool.query(
      `INSERT INTO conversation_reads (conversation_id, uid, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (conversation_id, uid) DO UPDATE SET last_read_at = NOW()`,
      [conversationId, readerUid]
    );
  }
  return rows;
}
