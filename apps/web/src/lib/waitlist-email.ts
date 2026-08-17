/**
 * Branded waitlist confirmation email.
 * Source of truth: apps/web/emails/waitlist-confirmation.html — this module is
 * that file inlined as a literal so the route needs no runtime file read.
 * If you edit the template, regenerate this string to match.
 */
export const WAITLIST_CONFIRMATION_HTML = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>You're on the PetAppro waitlist</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { margin:0; padding:0; background:#F2FAFB; -webkit-text-size-adjust:100%; }
    a { text-decoration:none; }
    @media (max-width:600px){
      .container{ width:100% !important; border-radius:0 !important; }
      .px{ padding-left:24px !important; padding-right:24px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#F2FAFB;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#F2FAFB; font-size:1px; line-height:1px;">
    You're on the list — we'll email you the moment PetAppro opens its doors.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2FAFB;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(28,44,50,0.08);">

          <!-- header / logo -->
          <tr>
            <td align="center" style="padding:32px 40px 24px;">
              <img src="https://petappro.com/brands/petappro/petappro-wordmark.png" width="150" alt="PetAppro" style="display:block; width:150px; max-width:150px; height:auto; border:0;">
            </td>
          </tr>

          <!-- hero band -->
          <tr>
            <td class="px" style="background:#006073; padding:40px; text-align:center;">
              <div style="font-family:'Poppins',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:28px; line-height:1.2; font-weight:700; letter-spacing:-0.01em; color:#ffffff;">
                You're on the list! <img src="https://petappro.com/brands/petappro/paw-accent.png" width="28" height="28" alt="" style="vertical-align:middle; display:inline-block; width:28px; height:28px; margin-left:2px;">
              </div>
              <div style="font-family:'Poppins',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:1.5; font-weight:400; color:#CDECEF; padding-top:8px;">
                Thanks so much for signing up.
              </div>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td class="px" style="padding:32px 40px 8px; font-family:'Poppins',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:1.6; color:#304249;">
              <p style="margin:0 0 20px;">
                You'll be among the first through the dog door. We're putting the finishing touches on PetAppro now — and the moment we open, you'll get an invite to set up your business and claim your spot.
              </p>
              <p style="margin:0 0 8px;">
                PetAppro is the booking app built for pet-care providers — your bookings, clients, and payments in one place. No marketplace, no middleman taking a cut. Just your business, running smoother.
              </p>
            </td>
          </tr>

          <!-- reply accent -->
          <tr>
            <td class="px" style="padding:16px 40px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2FAFB; border-left:4px solid #68A82F; border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px; font-family:'Poppins',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#304249;">
                    Got a question, or a feature you'd love to see? Just reply to this email — a real person reads every one.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- social / say hi -->
          <tr>
            <td class="px" style="padding:12px 40px 4px; font-family:'Poppins',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#304249; text-align:center;">
              Come say hi — follow along, or message us on Instagram or Facebook with your ideas or what you need. We'd love to hear from you.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 40px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 10px;">
                    <a href="https://instagram.com/petappro" target="_blank">
                      <img src="https://petappro.com/brands/petappro/instagram.png" width="40" height="40" alt="Instagram" style="display:block; border:0; width:40px; height:40px;">
                    </a>
                  </td>
                  <td style="padding:0 10px;">
                    <a href="https://facebook.com/petappro" target="_blank">
                      <img src="https://petappro.com/brands/petappro/facebook.png" width="40" height="40" alt="Facebook" style="display:block; border:0; width:40px; height:40px;">
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td class="px" style="background:#002C38; padding:28px 40px; font-family:'Poppins',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#9FC6CD; text-align:center;">
              <div style="color:#ffffff; font-weight:600; font-size:14px; margin-bottom:4px;">PetAppro</div>
              <div style="margin-bottom:12px;">A product of Base509 LLC</div>
              <div style="margin-bottom:12px; color:#7FB0B8;">Base509 LLC &middot; 1875 Mission St, Ste 103 #660 &middot; San Francisco, CA 94103</div>
              <div style="margin-bottom:4px; color:#7FB0B8;">You're getting this because you joined the waitlist at <a href="https://petappro.com" style="color:#CDECEF; text-decoration:underline;">petappro.com</a>.</div>
              <div style="color:#7FB0B8;">Didn't sign up, or changed your mind? Just reply "remove" and we'll take you off the list.</div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
