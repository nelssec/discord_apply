'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { getUserAvatarUrl } from '@/lib/discord';

interface NavbarProps {
  guildId?: string;
  guildName?: string;
}

export default function Navbar({ guildId, guildName }: NavbarProps) {
  const { data: session } = useSession();

  return (
    <nav className="bg-discord-darker border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-white">
              Guild Apps
            </Link>

            {guildId && guildName && (
              <>
                <span className="mx-3 text-gray-500">/</span>
                <span className="text-gray-300">{guildName}</span>
              </>
            )}

            {guildId && (
              <div className="hidden md:flex ml-8 space-x-4">
                <Link
                  href={`/dashboard/${guildId}`}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Overview
                </Link>
                <Link
                  href={`/dashboard/${guildId}/applications`}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Applications
                </Link>
                <Link
                  href={`/dashboard/${guildId}/forms`}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Forms
                </Link>
                <Link
                  href={`/dashboard/${guildId}/settings`}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Settings
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {session?.user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Image
                    src={getUserAvatarUrl(session.user.id, session.user.image || null)}
                    alt={session.user.name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-gray-300 text-sm hidden sm:block">
                    {session.user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
