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

export interface FormRow {
  id: number;
  guild_id: string;
  name: string;
  description: string | null;
  enabled: number;
  log_channel_id: string | null;
  ticket_category_id: string | null;
  manager_role_ids: string | null;
  required_role_ids: string | null;
  restricted_role_ids: string | null;
  ping_role_ids: string | null;
  accept_role_ids: string | null;
  deny_role_ids: string | null;
  remove_role_ids: string | null;
  completion_message: string | null;
  accept_message: string | null;
  deny_message: string | null;
  cooldown_seconds: number;
  created_at: string;
}

export type QuestionType = 'text' | 'paragraph' | 'choice';

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

export interface QuestionRow {
  id: number;
  form_id: number;
  label: string;
  type: string;
  placeholder: string | null;
  required: number;
  options: string | null;
  position: number;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'denied';

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

export interface ApplicationRow {
  id: number;
  form_id: number;
  guild_id: string;
  user_id: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
  answers: string;
  status: string;
  ticket_channel_id: string | null;
  reviewer_id: string | null;
  reviewer_username: string | null;
  reason: string | null;
  created_at: string;
  resolved_at: string | null;
}
