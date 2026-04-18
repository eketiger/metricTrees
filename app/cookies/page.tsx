export default function CookiesPage() {
  return (
    <main className="prose-wrap">
      <h1>Cookie Policy</h1>
      <p>Metrics uses a small number of cookies and localStorage entries to make the app work and, with your consent, to improve it.</p>
      <h2>Essential</h2>
      <p>Session cookies for authentication (NextAuth) and CSRF protection.</p>
      <h2>Analytics (opt-in)</h2>
      <p>Mixpanel, loaded only after you accept the consent banner. Used to understand feature usage and improve the product.</p>
    </main>
  );
}
