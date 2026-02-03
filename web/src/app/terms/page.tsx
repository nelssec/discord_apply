export default function TermsPage() {
  return (
    <main className="min-h-screen bg-discord-dark py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>By using Guild Applications (&quot;the Bot&quot;), you agree to these Terms of Service. If you do not agree, do not use the Bot.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
            <p>Guild Applications is a Discord bot that provides:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Customizable application forms for Discord servers</li>
              <li>Ticket-based review system for applications</li>
              <li>Web dashboard for managing applications</li>
              <li>Automatic role assignment based on application decisions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Bot in compliance with Discord&apos;s Terms of Service</li>
              <li>Not use the Bot for spam, harassment, or illegal activities</li>
              <li>Not attempt to exploit, hack, or abuse the Bot</li>
              <li>Ensure your server&apos;s use of the Bot complies with applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Server Administrator Responsibilities</h2>
            <p>Server administrators who install the Bot are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Configuring appropriate permissions for reviewers</li>
              <li>Ensuring application questions comply with applicable laws</li>
              <li>Handling user data requests from their members</li>
              <li>Moderating the use of the Bot within their server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Limitations of Liability</h2>
            <p>The Bot is provided &quot;as is&quot; without warranties of any kind. We are not liable for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Data loss or service interruptions</li>
              <li>Actions taken by server administrators using the Bot</li>
              <li>Decisions made based on application data</li>
              <li>Any damages arising from use of the Bot</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Termination</h2>
            <p>We reserve the right to terminate or restrict access to the Bot for any user or server that violates these terms or Discord&apos;s Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">7. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the Bot after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">8. Contact</h2>
            <p>For questions about these terms, please open an issue on our GitHub repository or contact a server administrator.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
