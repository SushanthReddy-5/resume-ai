import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "../../../../utils/supabase/server";

export async function POST() {
  try {
    // Check Supabase login
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in before making a payment." },
        { status: 401 }
      );
    }

    // Check Razorpay credentials
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay environment variables are missing" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    // Create Razorpay order linked to the user
    const order = await razorpay.orders.create({
      amount: 19900,
      currency: "INR",
      receipt: `resume_${Date.now()}`,
      notes: {
        user_id: user.id,
        product: "Single Application",
      },
    });

    return NextResponse.json({
      ...order,
      key_id,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create payment order" },
      { status: 500 }
    );
  }
}
