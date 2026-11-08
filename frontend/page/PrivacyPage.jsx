import LegalLayout from "./LegalLayout";
import { LEGAL } from "./legalConfig";

const sections = [
  {
    id: "who-we-are",
    title: "Who we are",
    content: (
      <p>
        {LEGAL.companyName}, {LEGAL.companyAddress}, runs {LEGAL.appName} and is
        responsible for your personal data as described here. Questions? Write to{" "}
        <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    content: (
      <>
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address, and password
            (stored in hashed form).
          </li>
          <li>
            <strong>Content you add:</strong> anything you create or upload in{" "}
            {LEGAL.appName}.
          </li>
          <li>
            <strong>Usage and device data:</strong> IP address, browser type, device
            type, pages viewed, and error logs.
          </li>
          <li>
            <strong>Messages:</strong> what you send us when you contact support.
          </li>
        </ul>
        <p>We don’t knowingly collect more than we need to run the service.</p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use your data and why",
    content: (
      <>
        <ul>
          <li>
            <strong>To provide the service</strong> (creating your account, storing your
            content, signing you in). Legal basis: performing our contract with you.
          </li>
          <li>
            <strong>To keep things secure and fix problems</strong> (preventing abuse,
            debugging). Legal basis: our legitimate interest.
          </li>
          <li>
            <strong>To improve {LEGAL.appName}</strong> using aggregated usage data.
            Legal basis: our legitimate interest.
          </li>
          <li>
            <strong>To email you</strong> about your account and, only if you opt in,
            product news. Legal basis: contract, or your consent.
          </li>
          <li>
            <strong>To meet legal duties</strong> such as tax and accounting rules.
          </li>
        </ul>
        <p>We don’t sell your personal data.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    content: (
      <>
        <p>
          We share data only with providers that help us run the service, such as
          hosting, email delivery, and analytics. They may use it only on our
          instructions and under a data processing agreement. We may also disclose data
          if the law requires it or to protect our rights and users’ safety.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and similar technologies",
    content: (
      <p>
        We use essential cookies to keep you signed in and to remember basic
        preferences. If we add analytics or marketing cookies, we’ll ask for your
        consent first, and you can withdraw it at any time.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    content: (
      <p>
        We keep your data while your account is active. After you delete your account
        we remove or anonymize it within 30 days, except for records we must keep by
        law (for example invoices) and short-lived backups.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    content: (
      <p>
        We protect your data with encryption in transit, hashed passwords, access
        controls, and regular reviews. No system is perfectly secure, so if a breach
        affects you we’ll notify you and the authorities as the law requires.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: (
      <>
        <p>Under the GDPR, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Correct data that is wrong or incomplete.</li>
          <li>Delete your data.</li>
          <li>Restrict or object to certain processing.</li>
          <li>Receive your data in a portable format.</li>
          <li>Withdraw consent at any time, without affecting earlier processing.</li>
        </ul>
        <p>
          To use any of these, email{" "}
          <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. You can
          also complain to your local data protection authority.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    content: (
      <p>
        If a provider processes your data outside the European Economic Area, we make
        sure it’s protected by an adequacy decision or Standard Contractual Clauses.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    content: (
      <p>
        {LEGAL.appName} isn’t meant for anyone under 16. If you believe a child has
        given us personal data, contact us and we’ll delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <p>
        When we make material changes, we’ll update the date above and notify you by
        email or in the app.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    content: (
      <p>
        {LEGAL.companyName}
        <br />
        {LEGAL.companyAddress}
        <br />
        <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro={`This policy explains what personal data ${LEGAL.appName} collects, why we collect it, and the choices you have.`}
      sections={sections}
      otherLink={{ href: "/term-and-condition/", label: "Terms of Service" }}
    />
  );
}
