import Link from 'next/link';
import Image from 'next/image';
import { getUserAvatarUrl } from '@/lib/discord';
import type { Application } from '@/types';

interface ApplicationCardProps {
  application: Application;
  formName: string;
  guildId: string;
}

export default function ApplicationCard({
  application,
  formName,
  guildId,
}: ApplicationCardProps) {
  const statusColors = {
    pending: 'bg-discord-yellow/20 text-discord-yellow border-discord-yellow',
    accepted: 'bg-discord-green/20 text-discord-green border-discord-green',
    denied: 'bg-discord-red/20 text-discord-red border-discord-red',
  };

  const avatarUrl = getUserAvatarUrl(
    application.user_id,
    application.avatar,
    application.discriminator || undefined
  );

  const createdAt = new Date(application.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      href={`/dashboard/${guildId}/applications/${application.id}`}
      className="block bg-discord-darker rounded-lg p-4 border border-gray-700 hover:border-discord-blurple transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={avatarUrl}
            alt={application.username}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <h3 className="font-medium text-white">{application.username}</h3>
            <p className="text-sm text-gray-400">{formName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{createdAt}</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              statusColors[application.status]
            }`}
          >
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </span>
        </div>
      </div>

      {application.reason && application.status !== 'pending' && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            <span className="font-medium">Reason:</span> {application.reason}
          </p>
          {application.reviewer_username && (
            <p className="text-xs text-gray-500 mt-1">
              Reviewed by {application.reviewer_username}
            </p>
          )}
        </div>
      )}
    </Link>
  );
}
