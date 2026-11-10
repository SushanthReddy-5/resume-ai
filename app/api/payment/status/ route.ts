import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in first.", hasAccess: false },
        { status: 401 }
      );
    }

    const { data: purchases, error } = await supabase
      .from("purchases")
      .select("id, amount, currency, status")
      .eq("user_id", user.id)
      .eq("status", "verified")
      .eq("amount", 19900)
      .eq("currency", "INR");

    if (error) {
      console.error("Purchase status error:", error);

      return NextResponse.json(
        { error: "Unable to check purchase status." },
        { status: 500 }
      );
    }

    const hasAccess = purchases.length > 0;

    return NextResponse.json({
      hasAccess,
      message: hasAccess
        ? "Single Application package unlocked."
        : "Please purchase the Single Application package.",
    });
  } catch (error) {
    console.error("Access check failed:", error);

    return NextResponse.json(
      { error: "Unable to check access." },
      { status: 500 }
    );
  }
}
