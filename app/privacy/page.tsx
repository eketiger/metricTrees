export default function PrivacyPage() {
  return (
    <main className="prose-wrap">
      <h1>Privacy Policy</h1>
      <p>
        This policy describes what data Metrics collects, how it&apos;s used, and how you can exercise
        your GDPR rights.
      </p>
      <h2>Data we collect</h2>
      <p>Email, name, avatar (from your auth provider), metric trees and nodes you create, subscription status, and usage analytics (only with your consent).</p>
      <h2>Your rights</h2>
      <p>You can request a full export of your data at <code>/api/user/data-export</code> and permanently delete your account at <code>/api/user/account</code>.</p>
      <h2>Contact</h2>
      <p>Email privacy@yourdomain.com for any privacy inquiries.</p>
    </main>
  );
}
