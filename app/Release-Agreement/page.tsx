import { redirect } from 'next/navigation';
import { PageHero, SiteShell } from '@/components/SiteShell';
import { contact } from '@/lib/site-content';
import { field, htmlEscape, sendPixilensEmail } from '@/lib/email';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Release Agreement',
  description: 'Photography and videography release agreement for Pixilens Photography clients in Austin, Dallas, Houston, and Texas.',
  path: '/Release-Agreement',
});

const releaseAgreement = `STANDARD PHOTOGRAPHY, VIDEOGRAPHY, AND DIGITAL MEDIA RELEASE AGREEMENT

This Standard Release Agreement ("Agreement") is entered into by and between Pixilens LLC, a Texas limited liability company with its principal place of business located in Austin, Travis County, Texas (hereinafter referred to as "Photographer" or "Pixilens"), and the undersigned Client (hereinafter referred to as "Client" or "You"), collectively referred to as the "Parties."

WHEREAS, Client desires to engage Photographer to provide photography, videography, live streaming, photobooth, and related digital media services (hereinafter collectively referred to as the "Services"); and

WHEREAS, Photographer will create, produce, and deliver photographs, videos, audio recordings, digital files, and other media content (hereinafter collectively referred to as the "Work Product") during the provision of the Services;

NOW, THEREFORE, in consideration of the mutual covenants, promises, and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

1. COPYRIGHT OWNERSHIP AND WORK FOR HIRE

1.1 All Work Product created by Photographer during the engagement, including but not limited to photographs, videos, audio recordings, edited files, raw files, negatives, digital files, prints, and any reproductions thereof (the "Work Product"), shall constitute "works made for hire" as defined under Section 101 of Title 17 of the United States Copyright Act (17 U.S.C. § 101 et seq.) to the maximum extent permitted by law.

1.2 To the extent any Work Product does not qualify as a work made for hire under applicable law, Client hereby irrevocably assigns to Photographer, and Photographer hereby accepts, all right, title, and interest in and to the Work Product, including all intellectual property rights therein, throughout the world, in perpetuity.

1.3 Photographer shall be the sole and exclusive owner of all copyrights, moral rights, and other intellectual property rights in and to the Work Product, including the right to reproduce, distribute, display, perform, transmit, create derivative works from, and otherwise exploit the Work Product in any and all media now known or hereafter devised, without restriction.

1.4 Client acknowledges and agrees that Photographer retains full copyright ownership of the Work Product and that this Agreement does not transfer any copyright ownership to Client, except as expressly stated herein.

2. LICENSE TO USE WORK PRODUCT

2.1 Photographer grants to Client a non-exclusive, non-transferable, revocable license to use, reproduce, display, and distribute the Work Product solely for Client's personal, non-commercial use, subject to the terms and conditions of this Agreement.

2.2 Client is expressly prohibited from:
    (a) Selling, licensing, sublicensing, distributing, or otherwise commercially exploiting the Work Product without the prior written consent of Photographer;
    (b) Altering, modifying, editing, cropping, or creating derivative works from the Work Product without the prior written consent of Photographer;
    (c) Removing, obscuring, or modifying any copyright notices, watermarks, or metadata embedded in the Work Product;
    (d) Using the Work Product in any manner that is defamatory, obscene, unlawful, or that infringes upon the rights of any third party.

2.3 If Client wishes to use the Work Product for commercial purposes, including but not limited to advertising, marketing, product packaging, website content, social media marketing, or resale, Client must obtain a separate written commercial use license from Photographer, subject to additional fees and terms to be negotiated in good faith.

3. PHOTOGRAPHER'S USE OF WORK PRODUCT

3.1 Client hereby grants to Photographer an irrevocable, perpetual, worldwide, royalty-free, fully sublicensable license to use, reproduce, distribute, display, publish, transmit, and create derivative works from the Work Product, in whole or in part, for the following purposes:
    (a) Inclusion in Photographer's professional portfolio, website, and social media accounts;
    (b) Use in advertising, marketing, promotional, and editorial materials;
    (c) Use in printed materials, including but not limited to brochures, business cards, flyers, and exhibition catalogs;
    (d) Use in presentations, pitch decks, and submissions for awards and competitions;
    (e) Exhibition in galleries, exhibitions, art fairs, and public displays;
    (f) Use in educational and training materials;
    (g) Any other lawful purpose as determined by Photographer in Photographer's sole discretion.

3.2 Photographer may use Client's name, likeness, and biographical information in connection with the promotion and distribution of the Work Product, unless Client provides a written objection to such use within thirty (30) days of the date of this Agreement, in which case Photographer shall remove Client's personal information from publicly accessible materials within a reasonable time.

3.3 Photographer may license the Work Product to third parties for editorial, educational, or commercial use, provided that such third-party use does not directly compete with Client's business or imply Client's endorsement of any third-party product or service.

4. MORAL RIGHTS WAIVER

4.1 To the fullest extent permitted by applicable law, including Section 106A of Title 17 of the United States Copyright Act (the Visual Artists Rights Act or "VARA"), Client waives and agrees never to assert any moral rights, including rights of attribution and integrity, in and to the Work Product.

4.2 Client consents to any alteration, modification, cropping, or reformatting of the Work Product by Photographer or by any third party authorized by Photographer.

4.3 In jurisdictions where moral rights cannot be waived, Client agrees to the maximum extent permitted by law to refrain from asserting any moral rights in and to the Work Product.

5. MODEL RELEASE AND CONSENT

5.1 Client represents and warrants that Client is at least eighteen (18) years of age and has the full legal capacity to enter into this Agreement. If Client is under eighteen (18) years of age, a parent or legal guardian must sign this Agreement on the minor's behalf, and by signing, the parent or legal guardian represents and warrants that they have the full legal authority to bind the minor to the terms of this Agreement.

5.2 Client represents and warrants that all individuals depicted in the Work Product (the "Subjects") have consented to the creation and use of the Work Product as described in this Agreement. Client is solely responsible for obtaining any necessary consents from Subjects that are not party to this Agreement.

5.3 Client understands and agrees that the Work Product may be displayed publicly, including on the internet, social media, print media, and in physical exhibitions, and that Subjects may be identifiable in such public displays.

5.4 Client acknowledges that Photographer may use artificial intelligence, machine learning, generative AI, and other advanced digital processing technologies to create, enhance, edit, or modify the Work Product, including but not limited to AI-generated composites, style transfers, background replacements, and automated retouching. Client consents to such use of technology in the creation and processing of the Work Product.

5.5 If the Services include live streaming or real-time transmission of video or audio, Client consents to the live broadcast and recording thereof, and to the subsequent use, distribution, and reproduction of such recordings by Photographer in accordance with the terms of this Agreement.

6. DELIVERY AND DIGITAL FILES

6.1 Photographer shall deliver the Work Product to Client in the format(s) specified during the engagement (digital download, online gallery, USB drive, print, or other medium).

6.2 Client acknowledges that digital files delivered by Photographer may be provided in various resolutions and formats. Photographer shall have no obligation to deliver raw or unedited files unless specifically agreed upon in a separate written agreement.

6.3 Client agrees to make backup copies of all digital files received from Photographer, as Photographer shall not be liable for loss or damage to digital files after delivery.

7. PAYMENT AND TERMS

7.1 Client agrees to pay Photographer the fees for the Services as outlined in the separate agreement, quote, or invoice provided by Photographer.

7.2 All fees are due in full prior to or at the time of the Services, unless otherwise agreed upon in writing. Outstanding balances must be paid before final delivery of the Work Product.

7.3 Client agrees that Photographer retains the right to withhold delivery of the Work Product until all fees have been paid in full.

8. LIABILITY AND INDEMNIFICATION

8.1 THE WORK PRODUCT IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. PHOTOGRAPHER MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT OF THIRD-PARTY RIGHTS.

8.2 Client agrees to indemnify, defend, and hold harmless Photographer, its officers, directors, employees, agents, affiliates, and successors from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees and court costs) arising out of or related to:
    (a) Any breach of Client's representations, warranties, or obligations under this Agreement;
    (b) Any unauthorized use by Client of the Work Product;
    (c) Any claim by a third party arising from Client's use of the Work Product;
    (d) Any defamatory, obscene, or unlawful use of the Work Product by Client.

8.3 Photographer's total liability under this Agreement shall not exceed the total fees paid by Client for the Services giving rise to the claim.

8.4 IN NO EVENT SHALL PHOTOGRAPHER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, OR BUSINESS INTERRUPTION, REGARDLESS OF THE THEORY OF LIABILITY, EVEN IF PHOTOGRAPHER HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

9. SCOPE AND LIMITATIONS OF RELEASE

9.1 This Release Agreement applies to all Work Product created during the engagement, regardless of whether the Work Product is delivered to Client or retained by Photographer.

9.2 If the Work Product contains images, likenesses, or contributions of third parties (including other photographers, assistants, or venue-provided content), Photographer makes no warranty regarding the rights of such third parties and shall have no liability for their unauthorized use.

9.3 Client waives any right to review and approve the finished Work Product prior to Photographer's use of the Work Product in accordance with Section 3 of this Agreement, including the right to approve the manner in which the Work Product is edited or used.

9.4 Client acknowledges that photography and videography involve artistic judgment and creative discretion on the part of Photographer. Photographer shall not be required to deliver any specific number of images or specific compositions, and the final selection, editing, and processing of the Work Product shall be at Photographer's sole discretion.

10. CONFIDENTIALITY

10.1 Photographer agrees to keep confidential all personal information, event details, and other information provided by Client in connection with the Services, and shall not disclose such information to any third party except as required by law or as necessary for the performance of the Services.

10.2 This confidentiality obligation shall survive the termination of this Agreement.

11. GOVERNING LAW AND JURISDICTION

11.1 This Agreement shall be governed by and construed in accordance with the laws of the State of Texas, without regard to Texas's conflict of laws principles, and in accordance with the intellectual property laws of the United States, including the Copyright Act of 1976 (17 U.S.C. § 101 et seq.), the Digital Millennium Copyright Act (17 U.S.C. § 512 et seq.), and the Visual Artists Rights Act (17 U.S.C. § 106A).

11.2 Any disputes arising out of or related to this Agreement shall be submitted to the exclusive jurisdiction of the state and federal courts located in Travis County, Texas, and the Parties irrevocably consent to the personal jurisdiction and venue of such courts.

11.3 Client consents to service of process via email at the email address provided in this Agreement or any other method permitted under Texas law.

12. MISCELLANEOUS

12.1 This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior or contemporaneous oral or written agreements, understandings, or representations.

12.2 This Agreement may be executed in counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument. Electronic signatures are binding and valid.

12.3 If any provision of this Agreement is found to be invalid or unenforceable by a court of competent jurisdiction, such finding shall not affect the remaining provisions of this Agreement, which shall continue in full force and effect.

12.4 Photographer may assign or transfer its rights and obligations under this Agreement to any successor entity. Client may not assign or transfer this Agreement without the prior written consent of Photographer.

12.5 No waiver of any provision of this Agreement shall be effective unless in writing and signed by the waiving Party.

12.6 The headings and titles in this Agreement are for convenience only and have no legal effect.

12.7 Severability: If any term or provision of this Agreement is invalid, illegal, or unenforceable in any jurisdiction, such invalidity, illegality, or unenforceability shall not affect any other term or provision, and this Agreement shall be construed as if such invalid, illegal, or unenforceable term or provision had never been contained herein.

12.8 The effective date of this Agreement is the date of the last signature below.

THREE-DAY RIGHT OF RESCISSION (TEXAS BUSINESS AND COMMERCIALS CODE § 61.003): For contracts entered into at a location other than the Seller's place of permanent business, Client may cancel this Agreement within three (3) calendar days after the date of the Agreement by providing written notice to Photographer. After the three-day rescission period, Client's consent to the release terms becomes irrevocable.

---

CLIENT ACKNOWLEDGMENT AND CONSENT

By typing my full name in the signature field below and selecting "I Agree," I, the undersigned Client, acknowledge that I have read this Standard Release Agreement in its entirety, understand its terms, and voluntarily agree to be bound by all provisions contained herein. I consent to the capture, use, distribution, licensing, and publication of the Work Product as described above. I understand this Agreement is governed by Texas law and that any disputes shall be resolved in Travis County, Texas.

Client Signature: ______________________________
Client Full Name (typed): ______________________________
Date: __________________________________`;

function formatText(data: Record<string, string>) {
  return `Release Agreement signed by ${data.fullName} on ${data.date}\n\nI consent to the terms of the Standard Release Agreement.\n\nSignature: ${data.signature}\nEmail: ${data.email}`;
}

function formatHtml(data: Record<string, string>) {
  return `<div style="font-family:Arial,sans-serif;color:#17130f;line-height:1.5;"><h2 style="color:#a87921;">Release Agreement — Signed</h2><p><strong>Signed by:</strong> ${data.fullName}</p><p><strong>Date:</strong> ${data.date}</p><p><strong>Email:</strong> ${data.email}</p><p><strong>Signature:</strong> ${data.signature}</p><p><strong>Consent:</strong> ${data.consent}</p><hr><h3 style="color:#a87921;">Release Agreement Text</h3><pre style="white-space:pre-wrap;font-size:12px;">${htmlEscape(releaseAgreement)}</pre></div>`;
}

async function sendReleaseForm(formData: FormData) {
  'use server';

  const fullName = field(formData, 'fullName');
  const email = field(formData, 'email');
  const consent = field(formData, 'consent');
  const signature = field(formData, 'signature');
  const date = new Date().toISOString().split('T')[0];

  if (!fullName || !email || consent !== 'Yes' || !signature) {
    redirect('/Release-Agreement?status=missing');
  }

  const data = { fullName, email, consent, signature, date };

  const sent = await sendPixilensEmail({
    toUser: email,
    userName: fullName,
    subject: `Release Agreement signed — ${fullName}`,
    text: formatText(data),
    html: formatHtml(data),
  });

  redirect(sent ? '/Release-Agreement?status=sent' : '/Release-Agreement?status=email-not-configured');
}

export default async function ReleaseAgreementPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;

  return (
    <SiteShell>
      <PageHero eyebrow="Release Agreement" title="Standard Release Agreement">
        <p>Review and sign the standard photography, videography, and digital media release agreement for Pixilens LLC.</p>
      </PageHero>

      <section className="mx-auto max-w-4xl px-5 pb-20 md:px-8">
        <div className="glass-panel rounded-xl p-6 md:p-9 prose prose-sm max-w-none text-[#17130f]/80">
          <pre className="whitespace-pre-wrap text-xs leading-6">{releaseAgreement}</pre>
        </div>

        <div className="mt-8 glass-panel rounded-xl p-6 md:p-9">
          <h2 className="font-art gold-text text-xl mb-5">Sign &amp; Submit</h2>

          {params.status === 'sent' ? (
            <div className="glass-panel mb-6 rounded-xl p-5 text-center text-[#17130f]/75">Your signed release agreement has been submitted to Pixilens. A copy has been sent to your email.</div>
          ) : null}
          {params.status === 'missing' ? (
            <div className="glass-panel mb-6 rounded-xl border-red-200/70 p-5 text-center text-red-700">Please complete all required fields (full name, email, consent, and signature).</div>
          ) : null}
          {params.status === 'email-not-configured' ? (
            <div className="glass-panel mb-6 rounded-xl border-red-200/70 p-5 text-center text-red-700">Email sending is not configured. Your form was submitted but no confirmation email was sent. You can reach us at {contact.email}.</div>
          ) : null}

          <form action={sendReleaseForm} className="grid gap-5 sm:grid-cols-2">
            <label className="public-label sm:col-span-2">Full Name *<input name="fullName" required className="public-input" /></label>
            <label className="public-label">Email *<input name="email" type="email" required className="public-input" /></label>
            <label className="public-label sm:col-span-2">Date *<input name="date" type="date" required className="public-input public-date" /></label>

            <fieldset className="sm:col-span-2">
              <legend className="public-label mb-3">Consent *</legend>
              <label className="flex items-start gap-3 rounded-lg border border-[#281f16]/10 bg-white/55 p-3 text-sm text-[#17130f]/72">
                <input name="consent" value="Yes" type="radio" required className="mt-1 accent-[#a87921]" />
                <span>I have read and agree to the Standard Release Agreement above. I consent to the use of my Work Product as described, including reproduction, distribution, public display, and licensing by Pixilens LLC.</span>
              </label>
            </fieldset>

            <label className="public-label sm:col-span-2">Signature *<input name="signature" required className="public-input" placeholder="Type your full legal name as signature" /></label>

            <button className="glass-button sm:col-span-2 cursor-pointer" type="submit">Submit Release Agreement</button>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}