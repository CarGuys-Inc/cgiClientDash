import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/utils/supabase/server"; // Ensure this path is correct for your server client
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    // 1. Await the client creation
    const supabase = await createClient(); 
    
    // 2. Now you can access .auth
    const { data: { user } } = await supabase.auth.getUser();
    const supabaseUserId = user?.id || null;

    const body = await req.json();
    console.log("📨 Received signup data:", body);
    // 1. Destructure all fields
    const { 
      firstName,
      lastName,
      jobDescription,
      email,

      companyName,
      companyPhone,
      contactPhone, // ✅ NEW

      companyAddress,
      companyCity,
      companyState,
      companyZip,

      jobName,
      incomeMin,
      incomeMax,
      incomeRate,
      amountPaid,
      subscriptionName,

      stripePaymentId,
      stripeSubscriptionId,
      stripe_product_id,

      hasUpsell,
      upsellJobName,
      upsellIncomeMin,
      upsellIncomeMax,
      upsellIncomeRate,

      //UTM
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      utm_id,
      consentToCharge,
      signatureName,
    } = body;

    console.log("UTM Parameters:", {
      utm_source,
      utm_medium,});

    let signedTermsUrl: string | null = null;
    let signedTermsPath: string | null = null;
    const signatureDate = new Date();
    const signatureDateString = signatureDate.toISOString();
    const signatureDisplayName =
      (typeof signatureName === "string" && signatureName.trim())
        ? signatureName.trim()
        : "Authorized Signer";

    if (consentToCharge === true) {
      try {
        const templatePath = path.join(process.cwd(), "public", "terms-of-service.pdf");
        const templateBytes = await readFile(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const pages = pdfDoc.getPages();
        const lastPage = pages[pages.length - 1];
        const { height, width } = lastPage.getSize();
        const signatureFontName =
          (StandardFonts as Record<string, string>).TimesItalic ||
          (StandardFonts as Record<string, string>).HelveticaOblique ||
          StandardFonts.Helvetica;
        const signatureFont = await pdfDoc.embedFont(signatureFontName);
        const labelFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const leftX = 70;
        const signatureY = Math.max(130, height * 0.14);
        const dateX = Math.min(width - 160, leftX + 280);

        lastPage.drawText(signatureDisplayName, {
          x: leftX,
          y: signatureY,
          size: 20,
          font: signatureFont,
          color: rgb(0.1, 0.1, 0.1),
        });
        lastPage.drawText(`Date: ${signatureDate.toLocaleDateString("en-US")}`, {
          x: dateX,
          y: signatureY + 2,
          size: 9,
          font: labelFont,
          color: rgb(0.45, 0.45, 0.45),
        });

        const signedPdfBytes = await pdfDoc.save();
        const adminClient = createAdminClient();
        const bucketName = "signed-agreements";

        const { data: buckets, error: bucketsError } = await adminClient.storage.listBuckets();
        if (!bucketsError && !buckets?.some((bucket) => bucket.name === bucketName)) {
          await adminClient.storage.createBucket(bucketName, { public: false });
        }

        const fileKeyBase = stripePaymentId || stripeSubscriptionId || `${Date.now()}`;
        signedTermsPath = `checkout-consents/${fileKeyBase}.pdf`;
        console.log("📄 Signed terms upload target:", {
          bucket: bucketName,
          path: signedTermsPath,
        });
        const { error: uploadError } = await adminClient.storage
          .from(bucketName)
          .upload(signedTermsPath, signedPdfBytes, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadError) {
          console.error("⚠️ Signed PDF upload failed:", uploadError.message);
        } else {
          console.log("✅ Signed PDF uploaded", { bucket: bucketName, path: signedTermsPath });
          const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
            .from(bucketName)
            .createSignedUrl(signedTermsPath, 60 * 60 * 24 * 7);
          if (signedUrlError) {
            console.error("⚠️ Signed PDF URL creation failed:", signedUrlError.message);
          } else {
            signedTermsUrl = signedUrlData?.signedUrl ?? null;
            console.log("🔗 Signed PDF URL created:", signedTermsUrl);
          }
        }
      } catch (pdfErr: any) {
        console.error("⚠️ Signed PDF generation failed:", pdfErr?.message ?? pdfErr);
      }
    }

    // console.log("🚀 Forwarding data to Project B for:", email, "User ID:", supabaseUserId);

    // 2. Determine the correct Backend URL dynamically
    const API_BASE = process.env.NODE_ENV === "production"
      ? "https://dashboard.carguysinc.com" 
      : "http://127.0.0.1:8000";
    // --- Send to Zapier (non-blocking) ---
    try {
      const zapierUrl = "https://hooks.zapier.com/hooks/catch/12481932/uwnzp6i/";
      const zapierPayload = {
        source: "nextjs_checkout",
        supabaseUserId,

        firstName,
        lastName,
        email,
        contactPhone,

        companyName,
        companyPhone,

        jobName,
        incomeMin,
        incomeMax,
        incomeRate,

        hasUpsell,
        upsellJobName,
        upsellIncomeMin,
        upsellIncomeMax,
        upsellIncomeRate,

        stripePaymentId,
        stripeSubscriptionId,
        stripe_product_id,
        subscriptionName,
        amountPaid,

        // ✅ UTM PAYLOAD
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        utm_id,
        consentToCharge: consentToCharge === true,
        signatureName: signatureDisplayName,
        signatureDate: signatureDateString,
        signedTermsUrl,
        signedTermsPath,
        // Optional: timestamp for Zap history
        sentAt: new Date().toISOString(),
      };
      const zapierRes = await fetch(zapierUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(zapierPayload),
      });
      if (!zapierRes.ok) {
        const zapierBody = await zapierRes.text().catch(() => "");
        console.error("⚠️ Zapier webhook responded with error", {
          status: zapierRes.status,
          statusText: zapierRes.statusText,
          body: zapierBody,
        });
      } else {
        console.log("⚡ Zapier webhook sent", { status: zapierRes.status });
      }
    } catch (zapErr: any) {
      // DO NOT FAIL THE REQUEST FOR ZAPIER
      console.error("⚠️ Zapier webhook failed:", zapErr?.message ?? zapErr);
    }

    // 3. Pass them to the external Webhook
    const webhookRes = await fetch(`${API_BASE}/webhook/recruiterflow`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json" 
      },
      body: JSON.stringify({
        source: "nextjs_checkout",
        supabaseUserId,

        firstName,
        lastName,
        jobDescription,
        email,

        companyName,
        companyPhone,   // business phone
        contactPhone,   // ✅ hiring contact phone

        companyAddress,
        companyCity,
        companyState,
        companyZip,

        jobName,
        incomeMin,
        incomeMax,
        incomeRate,
        amountPaid,
        subscriptionName,
        stripePaymentId,
        stripeSubscriptionId,

        hasUpsell,
        upsellJobName,
        upsellIncomeMin,
        upsellIncomeMax,
        upsellIncomeRate,

        stripe_product_id,
        consentToCharge: consentToCharge === true,
        signatureName: signatureDisplayName,
        signatureDate: signatureDateString,
        signedTermsUrl,
        signedTermsPath,


      }),

    });

    if (!webhookRes.ok) {
      // ... (rest of your error handling logic)
      console.error("❌ Webhook Error:", await webhookRes.text());
      return NextResponse.json({ error: `Backend Error: ${webhookRes.status}` }, { status: 502 });
    }


    console.log("✅ Project B confirmed receipt.");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ CRITICAL WEBHOOK FAILURE:", error.message);
    return NextResponse.json({ error: "Setup system is currently unreachable." }, { status: 500 });
  }
}
