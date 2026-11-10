
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "../../../../utils/supabase/server";

export async function POST(request: Request) {
  try {
    // Verify logged-in user
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay credentials missing." },
        { status: 500 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { error: "Payment details missing." },
        { status: 400 }
      );
    }

    // Verify payment signature
    const expectedSignature = createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(razorpay_signature);

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    // Fetch payment and order directly from Razorpay
    const razorpay = new Razorpay({ key_id, key_secret });

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (
      payment.status !== "captured" ||
      payment.order_id !== razorpay_order_id ||
      payment.amount !== 19900 ||
      payment.currency !== "INR"
    ) {
      return NextResponse.json(
        { error: "Payment is not successfully captured." },
        { status: 400 }
      );
    }

    // Confirm order belongs to logged-in user
    if (
      order.amount !== 19900 ||
      order.currency !== "INR" ||
      order.notes?.user_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Order does not belong to this account." },
        { status: 403 }
      );
    }

    // Save verified purchase in Supabase
    const { error: insertError } = await supabase
      .from("purchases")
      .insert({
        user_id: user.id,
        razorpay_order_id,
        razorpay_payment_id,
        amount: 19900,
        currency: "INR",
        status: "verified",
      });

    if (insertError) {
      console.error("Purchase save failed:", insertError);

      return NextResponse.json(
        { error: "Payment verified, but purchase could not be saved." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and purchase saved successfully!",
    });
  } catch (error) {
    console.error("Payment verification failed:", error);

    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
