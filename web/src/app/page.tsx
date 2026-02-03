import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-discord-blurple to-purple-500 bg-clip-text text-transparent">
          Guild Applications
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Streamline your Discord server&apos;s application process with customizable forms,
          ticket-based review, and comprehensive management tools.
        </p>

        <div className="grid gap-4 md:grid-cols-3 mb-12">
          <div className="bg-discord-darker p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Custom Forms</h3>
            <p className="text-gray-400 text-sm">
              Create multiple application forms with custom questions
            </p>
          </div>
          <div className="bg-discord-darker p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Ticket System</h3>
            <p className="text-gray-400 text-sm">
              Private channels for applicant-staff communication
            </p>
          </div>
          <div className="bg-discord-darker p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Role Management</h3>
            <p className="text-gray-400 text-sm">
              Automatic role assignment on accept or deny
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-discord-blurple hover:bg-discord-blurple/80 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Login with Discord
          </Link>
          <a
            href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-discord-dark hover:bg-discord-darker border border-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Add to Server
          </a>
        </div>
      </div>
    </main>
  );
}
