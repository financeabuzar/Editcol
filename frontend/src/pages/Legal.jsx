import { useParams } from "react-router-dom";

const PAGES = {
  terms: { title: "Terms of Service", body: `
1. Acceptance of Terms — By using EditCol, you agree to these terms.
2. Eligibility — You must be 18+ to use the platform.
3. Accounts — You are responsible for maintaining account security and the accuracy of your information.
4. Editor obligations — Editors must complete identity verification (email + phone), provide accurate portfolio information, and deliver work as agreed.
5. Client obligations — Clients must provide accurate project briefs, respond to messages in a reasonable timeframe, and pay agreed amounts.
6. Prohibited conduct — No fraud, harassment, fake reviews, duplicate accounts, IP infringement, or scams. Violations result in suspension or ban.
7. Reviews and ratings — Reviews must be honest and tied to a real project. EditCol may remove fake reviews.
8. Disputes — Reach out to support@editcol.com before escalating.
9. Limitation of liability — EditCol is a marketplace and is not a party to contracts between clients and editors.
10. Termination — We may suspend or terminate accounts for violations of these terms.
11. Changes — We may update these terms. Continued use constitutes acceptance.
`},
  privacy: { title: "Privacy Policy", body: `
1. Data we collect — Account details (name, email, phone), profile content (bio, portfolio), messages, and usage data.
2. How we use data — To operate the marketplace, verify users, prevent fraud, and improve services.
3. Verification — Email and phone are verified to combat fake accounts and protect the community.
4. Sharing — We never sell your personal data. We share only with service providers under contract.
5. Cookies — We use essential, functional, and analytics cookies (see Cookie Policy).
6. Security — Passwords are bcrypt-hashed; sessions are signed JWTs in httpOnly cookies.
7. Your rights — Access, correct, export, or delete your data by contacting privacy@editcol.com.
8. Retention — We retain accounts until you delete them or violate our policies.
9. International transfers — Data may be stored in our cloud provider's data centers.
`},
  cookies: { title: "Cookie Policy", body: `
1. Essential cookies — Authentication, session, security.
2. Functional cookies — Preferences (theme, language).
3. Analytics cookies — Anonymous traffic insights to improve product.
4. Managing cookies — Use your browser settings to manage cookies. Disabling essential cookies will break the app.
`},
  refund: { title: "Refund Policy", body: `
1. Refund eligibility — Clients may request a refund if an editor fails to deliver work matching the agreed brief.
2. Time window — Requests must be opened within 7 days of agreed delivery.
3. Mediation — EditCol may mediate disputes; verdict is final.
4. Editor protection — Refunds are not granted for work delivered as agreed or for change-of-mind cases.
5. Process — Open a dispute from your dashboard; the team responds within 48 hours.
`},
  community: { title: "Community Guidelines", body: `
1. Respect — Treat everyone with respect. No harassment, hate speech, or discrimination.
2. Authenticity — Only one account per person. No fake reviews. No misrepresentation.
3. Honesty — Showcase only work you created or contributed to.
4. Safety — Never share personal payment details outside the platform.
5. Quality — Communicate clearly, deliver on time, and respond promptly.
6. Reporting — Use the in-product Report tools for violations. Our team reviews every report.
`},
};

export default function LegalPage() {
  const { slug } = useParams();
  const page = PAGES[slug] || PAGES.terms;
  return (
    <div className="fade-in max-w-3xl mx-auto px-6 lg:px-10 py-16">
      <p className="text-xs font-bold tracking-wider uppercase text-gray-500">Legal</p>
      <h1 className="font-heading text-4xl font-bold text-gray-900 mt-2" data-testid={`legal-title-${slug}`}>{page.title}</h1>
      <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
      <article className="prose prose-gray max-w-none mt-8 whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
        {page.body.trim()}
      </article>
      <p className="mt-12 text-xs text-gray-500">Questions? Email <a href="mailto:legal@editcol.com" className="font-semibold text-gray-900 underline">legal@editcol.com</a></p>
    </div>
  );
}
