export type QuestionType = 'text' | 'paragraph' | 'choice';
export type ApplicationStatus = 'pending' | 'accepted' | 'denied';

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  created_at: string;
}

export interface Form {
  id: number;
  guild_id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  log_channel_id: string | null;
  ticket_category_id: string | null;
  manager_role_ids: string[];
  required_role_ids: string[];
  restricted_role_ids: string[];
  ping_role_ids: string[];
  accept_role_ids: string[];
  deny_role_ids: string[];
  remove_role_ids: string[];
  completion_message: string | null;
  accept_message: string | null;
  deny_message: string | null;
  cooldown_seconds: number;
  created_at: string;
}

export interface Question {
  id: number;
  form_id: number;
  label: string;
  type: QuestionType;
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
  position: number;
}

export interface Application {
  id: number;
  form_id: number;
  guild_id: string;
  user_id: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
  answers: Record<string, string>;
  status: ApplicationStatus;
  ticket_channel_id: string | null;
  reviewer_id: string | null;
  reviewer_username: string | null;
  reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface GuildWithBot {
  id: string;
  name: string;
  icon: string | null;
  hasBot: boolean;
  isAdmin: boolean;
}

export interface FormWithQuestions {
  form: Form;
  questions: Question[];
}

export interface ApplicationWithDetails {
  application: Application;
  form: Form;
  questions: Question[];
}
