  async function unlockApplication() {
    try {
      // Load Razorpay checkout script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Unable to load Razorpay."));
        document.body.appendChild(script);
      });

      // Create payment order
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create payment order."
        );
      }

      // Razorpay checkout options
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "ResumeAI",
        description: "Single Application Package",
        order_id: data.id,

        prefill: {
          email: userEmail || "",
        },

        theme: {
          color: "#2563eb",
        },

        handler: async function (payment: any) {
          try {
            const verifyResponse = await fetch(
              "/api/payment/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: payment.razorpay_order_id,
                  razorpay_payment_id: payment.razorpay_payment_id,
                  razorpay_signature: payment.razorpay_signature,
                }),
              }
            );

            const result = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                result.error || "Payment verification failed."
              );
            }

            alert(
              result.message || "Payment verified successfully!"
            );
          } catch (error) {
            alert(
              error instanceof Error
                ? error.message
                : "Payment verification failed."
            );
          }
        },
      };

      // Open Razorpay checkout
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Payment initialization failed."
      );
    }
  }
