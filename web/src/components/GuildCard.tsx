import Link from 'next/link';
import Image from 'next/image';
import { getGuildIconUrl } from '@/lib/discord';

interface GuildCardProps {
  id: string;
  name: string;
  icon: string | null;
  hasBot: boolean;
  isAdmin?: boolean;
}

export default function GuildCard({ id, name, icon, hasBot, isAdmin }: GuildCardProps) {
  const iconUrl = getGuildIconUrl(id, icon);

  if (!hasBot) {
    return (
      <div className="bg-discord-darker rounded-lg p-6 border border-gray-700 opacity-60">
        <div className="flex items-center gap-4">
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt={name}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-white">{name}</h3>
            <p className="text-sm text-gray-400">Bot not added</p>
          </div>
        </div>
        <a
          href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add Bot
        </a>
      </div>
    );
  }

  return (
    <Link
      href={`/dashboard/${id}`}
      className="bg-discord-darker rounded-lg p-6 border border-gray-700 hover:border-discord-blurple transition-colors block"
    >
      <div className="flex items-center gap-4">
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt={name}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-white">{name}</h3>
          <p className="text-sm text-discord-green">
            {isAdmin ? 'Admin' : 'Member'}
          </p>
        </div>
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
