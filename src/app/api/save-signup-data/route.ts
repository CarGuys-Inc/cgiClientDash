import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/utils/supabase/server"; // Ensure this path is correct for your server client
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = (forwardedFor?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || req.headers.get("cf-connecting-ip")
      || req.headers.get("true-client-ip")
      || null);
    // 1. Await the client creation
    const supabase = await createClient(); 
    
    // 2. Access auth user
    const { data: { user } } = await supabase.auth.getUser();
    const supabaseUserId = user?.id || null;

    const body = await req.json();

    // 3. Destructure all fields - ADDED stripeSubscriptionId
    const { 
      firstName,
      lastName,
      jobDescription,
      email,

      companyName,
      companyPhone,
      contactPhone,

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
      stripe_price_id,

      hasUpsell,
      upsellJobName,
      upsellIncomeMin,
      upsellIncomeMax,
      upsellIncomeRate,

      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      utm_id,
      consentToCharge,
      signatureName,
      signatureImage,
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

        if (typeof signatureImage === "string" && signatureImage.startsWith("data:image/png")) {
          const base64Data = signatureImage.split(",")[1];
          if (base64Data) {
            const signatureBytes = Buffer.from(base64Data, "base64");
            const signaturePng = await pdfDoc.embedPng(signatureBytes);
            const targetWidth = 200;
            const scale = targetWidth / signaturePng.width;
            const targetHeight = signaturePng.height * scale;
            lastPage.drawImage(signaturePng, {
              x: leftX,
              y: signatureY - 2,
              width: targetWidth,
              height: targetHeight,
            });
          }
        } else {
          lastPage.drawText(signatureDisplayName, {
            x: leftX,
            y: signatureY,
            size: 20,
            font: signatureFont,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
        lastPage.drawText(`Date: ${signatureDate.toLocaleDateString("en-US")}`, {
          x: dateX,
          y: signatureY + 2,
          size: 9,
          font: labelFont,
          color: rgb(0.45, 0.45, 0.45),
        });

        const signedPdfBytes = await pdfDoc.save();
        const adminClient = createAdminClient();
        const supabaseUrl =
          process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_SUPABASE_URL || "";
        const hasServiceKey = Boolean(
          process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        console.log("🔐 Supabase storage auth context:", {
          hasServiceKey,
          supabaseHost: supabaseUrl ? new URL(supabaseUrl).host : "unset",
        });
        const bucketName = "signed-agreements";

        const { data: buckets, error: bucketsError } = await adminClient.storage.listBuckets();
        if (bucketsError) {
          console.error("⚠️ Signed PDF bucket list failed:", bucketsError);
        }
        if (!bucketsError && !buckets?.some((bucket) => bucket.name === bucketName)) {
          const { error: createBucketError } = await adminClient.storage.createBucket(bucketName, {
            public: false,
          });
          if (createBucketError) {
            console.error("⚠️ Signed PDF bucket create failed:", createBucketError);
          }
        }

        const rawNameParts = [companyName, firstName, lastName]
          .filter((part) => typeof part === "string" && part.trim().length > 0)
          .map((part) =>
            part
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "")
          );
        const namePrefix = rawNameParts.length > 0 ? `${rawNameParts.join("-")}-` : "";
        const datePrefix = signatureDate.toISOString().slice(0, 10);
        const fileKeyBase = stripePaymentId || stripeSubscriptionId || `${Date.now()}`;
        signedTermsPath = `checkout-consents/${namePrefix}${datePrefix}-${fileKeyBase}.pdf`;
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
          console.error("⚠️ Signed PDF upload failed:", uploadError);
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

    // 4. Determine the correct Backend URL dynamically
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
        clientIp,

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
        companyPhone, 
        contactPhone,
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
        clientIp,
        consentToCharge: consentToCharge === true,
        signatureName: signatureDisplayName,
        signatureDate: signatureDateString,
        signedTermsUrl,
        signedTermsPath,
      }),

    });

    if (!webhookRes.ok) {
      const rawBody = await webhookRes.text().catch(() => "");
      let backendMessage = "";
      try {
        const parsed = rawBody ? JSON.parse(rawBody) : null;
        if (parsed && typeof parsed === "object") {
          backendMessage =
            typeof parsed.message === "string" ? parsed.message :
            typeof parsed.error === "string" ? parsed.error :
            typeof parsed.detail === "string" ? parsed.detail :
            "";
        }
      } catch {
        backendMessage = "";
      }

      const combinedMessage = backendMessage || rawBody || `Backend Error: ${webhookRes.status}`;
      console.error("❌ Webhook Error:", combinedMessage);

      const isDuplicateCompanySlug =
        combinedMessage.includes("companies_slug_unique") ||
        combinedMessage.includes("duplicate key value");

      if (isDuplicateCompanySlug) {
        return NextResponse.json(
          { error: "That company name is already in use. Please choose a different company name." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "We could not complete your setup right now. Please try again in a moment." },
        { status: 502 }
      );
    }

    console.log("✅ Project B confirmed receipt with Subscription ID.");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ CRITICAL WEBHOOK FAILURE:", error.message);
    return NextResponse.json({ error: "Setup system is currently unreachable." }, { status: 500 });
  }
}
