# Quote & review emails: one-time setup (about 10 minutes)

Every quote request and every review is emailed to **quovex.agency@gmail.com**
as a designed email. The designs are in `tools/email-templates/`.
Until these steps are done, you still get plain-text emails through the old
Web3Forms setup, so nothing is missed.

## 1. Create the EmailJS account
1. Go to https://www.emailjs.com and sign up with **quovex.agency@gmail.com**.
   The free plan sends 200 emails a month.

## 2. Connect Gmail
1. **Email Services → Add New Service → Gmail.**
2. Connect **quovex.agency@gmail.com** and allow sending.
3. Copy the **Service ID** (looks like `service_xxxxxxx`).

## 3. Create the "New quote" template
1. **Email Templates → Create New Template.**
2. Open the **Content** tab, switch the editor to **Code / HTML**, and paste
   everything from `tools/email-templates/quote.html`.
3. Fill in the fields on the right:
   - **Subject:** `New quote: {{name}} ({{service}})`
   - **To Email:** `quovex.agency@gmail.com`
   - **From Name:** `QUOVEX website`
   - **Reply To:** `{{reply_to}}`. Pressing Reply then answers the client directly.
4. Save, and copy the **Template ID** (looks like `template_xxxxxxx`).

## 4. Create the "New review" template
Same as step 3, with these changes:
- Paste everything from `tools/email-templates/review.html`.
- **Subject:** `New {{rating}}-star review`
- **To Email:** `quovex.agency@gmail.com`
- Leave **Reply To** empty.

Copy this template's **Template ID** too.

## 5. Copy your public key
**Account → General → Public Key.**

## 6. Security (recommended)
**Account → Security → Allowed origins:** add your website's address (for example
`https://quovex.netlify.app`), so only your site can send these emails.

## 7. Paste the 4 values into the site
Open `assets/notify.js` and fill in:

    var QUOVEX_EMAIL = {
      publicKey: '...',
      serviceId: 'service_...',
      quoteTemplate: 'template_...',
      reviewTemplate: 'template_...'
    };

Or just send the 4 values to Claude and it will add them for you.
