import { isAdminAuthenticated } from "@/lib/plan/auth";
import { database } from "@/lib/plan/excel/database";
import { handleExcelRequest } from "@/lib/plan/excel/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return handleExcelRequest(request, database, isAdminAuthenticated);
}
export async function POST(request: Request) {
  return handleExcelRequest(request, database, isAdminAuthenticated);
}
