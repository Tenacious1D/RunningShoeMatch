import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

function getSafeRedirectPath(requestedNext: string | null, origin: string) {
  if (!requestedNext) return "/admin";

  try {
    const requestedUrl = new URL(requestedNext, origin);
    return requestedUrl.origin === origin
      ? `${requestedUrl.pathname}${requestedUrl.search}${requestedUrl.hash}`
      : "/admin";
  } catch {
    return "/admin";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const requestedNext = searchParams.get("next");
  const next = getSafeRedirectPath(requestedNext, request.nextUrl.origin);

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(next);
    } else {
      redirect("/auth/error?error=Unable+to+verify+confirmation+link");
    }
  }

  redirect("/auth/error?error=Invalid+or+expired+confirmation+link");
}
