import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import pool from "@/lib/db";
import BankForm from "./BankForm";

async function getBankAccount(uid: string) {
  const { rows } = await pool.query(
    `SELECT id, bank_name AS "bankName", account_number AS "accountNumber", account_holder AS "accountHolder"
     FROM partner_bank_accounts WHERE partner_uid = $1 LIMIT 1`,
    [uid]
  );
  return rows[0] ?? null;
}

export default async function BankPage() {
  const session = await getSession();
  if (!session || session.role !== "partner") redirect("/");

  const existing = await getBankAccount(session.uid);

  return <BankForm existing={existing} />;
}
