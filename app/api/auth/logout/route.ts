import { NextResponse } from "next/server";
import { logout } from "@/lib/actions/auth";

export async function POST() {
  await logout();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001"));
}
