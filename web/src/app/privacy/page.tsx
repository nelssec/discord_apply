export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-discord-dark py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p>When you use Guild Applications, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Discord User Data:</strong> Your Discord user ID, username, and avatar (provided via Discord OAuth2)</li>
              <li><strong>Server Data:</strong> Server ID, name, and your roles in servers where the bot is installed</li>
              <li><strong>Application Data:</strong> Responses you submit through application forms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To process and display your applications to server administrators</li>
              <li>To manage permissions and determine who can review applications</li>
              <li>To send you notifications about your application status via Discord DM</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Data Storage</h2>
            <p>Your data is stored in a secure database. Application data is retained until:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The server administrator deletes it</li>
              <li>The bot is removed from the server</li>
              <li>You request deletion of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Data Sharing</h2>
            <p>We do not sell or share your personal data with third parties. Your application data is only visible to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You (your own applications)</li>
              <li>Server administrators and designated reviewers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your application data through the web dashboard</li>
              <li>Request deletion of your data by contacting a server administrator</li>
              <li>Revoke the bot&apos;s access by removing it from your server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">6. Contact</h2>
            <p>For privacy concerns, contact the server administrator who installed the bot, or reach out via our GitHub repository.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
