import LegalLayout from "./LegalLayout";
import { LEGAL } from "./legalConfig";

const sections = [
  {
    id: "acceptance",
    title: "Accepting these terms",
    content: (
      <p>
        By creating an account or using {LEGAL.appName}, you agree to these Terms of
        Service and to our <a href="/privacy">Privacy Policy</a>. If you don’t agree,
        please don’t use the service.
      </p>
    ),
  },
  {
    id: "eligibility",
    title: "Who can use the service",
    content: (
      <p>
        You must be at least 16 years old and able to enter a binding contract. If you
        use {LEGAL.appName} on behalf of an organization, you confirm that you have the
        authority to accept these terms for it.
      </p>
    ),
  },
  {
    id: "account",
    title: "Your account",
    content: (
      <>
        <p>
          You’re responsible for keeping your login details safe and for everything
          that happens under your account. Please:
        </p>
        <ul>
          <li>Give accurate information when you sign up and keep it up to date.</li>
          <li>Use a strong password and don’t share it.</li>
          <li>
            Tell us right away at <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> if
            you think someone else has accessed your account.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    content: (
      <>
        <p>When you use {LEGAL.appName}, you agree not to:</p>
        <ul>
          <li>Break any law or infringe anyone’s rights.</li>
          <li>Upload malware or try to disrupt, probe, or overload the service.</li>
          <li>Access accounts, data, or systems that aren’t yours.</li>
          <li>Scrape, copy, or resell the service without our written permission.</li>
          <li>Harass others or post unlawful, hateful, or deceptive content.</li>
        </ul>
      </>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    content: (
      <>
        <p>
          You own what you create and upload. You give us a limited license to host,
          store, and display it, only as needed to run and improve the service for you.
          That license ends when you delete the content or your account, except where we
          must keep a copy by law or in routine backups.
        </p>
        <p>You promise that you have the rights to everything you upload.</p>
      </>
    ),
  },
  {
    id: "our-property",
    title: "Our property",
    content: (
      <p>
        {LEGAL.appName}, including its software, design, and branding, belongs to{" "}
        {LEGAL.companyName} and its licensors. These terms don’t give you ownership of
        any of it. You may use the service only as these terms allow.
      </p>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party services",
    content: (
      <p>
        {LEGAL.appName} may link to or work with services we don’t control. We’re not
        responsible for their content, availability, or practices, and your use of them
        is subject to their own terms.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Ending your account",
    content: (
      <p>
        You can stop using {LEGAL.appName} and delete your account at any time. We may
        suspend or close your account if you seriously or repeatedly break these terms,
        or if we need to in order to meet legal obligations. Where possible we’ll tell
        you why and give you a chance to fix the problem first.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "Service availability and disclaimers",
    content: (
      <p>
        We work hard to keep {LEGAL.appName} reliable, but we provide it “as is” and
        can’t promise it will always be uninterrupted or error-free. Nothing in these
        terms limits rights you have as a consumer under mandatory law.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    content: (
      <p>
        To the extent the law allows, {LEGAL.companyName} isn’t liable for indirect or
        consequential losses, such as lost profits or lost data. We remain fully liable
        where the law doesn’t allow us to limit liability, including for intent, gross
        negligence, and injury to life, body, or health. Our total liability for other
        claims is limited to the amount you paid us in the 12 months before the claim.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: (
      <p>
        We may update these terms from time to time. For material changes we’ll notify
        you by email or in the app before they take effect. If you keep using{" "}
        {LEGAL.appName} after that date, you accept the updated terms.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    content: (
      <p>
        These terms are governed by {LEGAL.governingLaw}. Disputes will be handled by{" "}
        {LEGAL.courts}, unless mandatory consumer law gives you the right to go to
        another court.
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
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
      </p>
    ),
  },
];

export default function TermsAndCondition() {
  return (
    <LegalLayout
      title="Terms of Service"
      intro={`These terms explain the rules for using ${LEGAL.appName}. They’re written to be read, so please take a minute to go through them.`}
      sections={sections}
      otherLink={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
