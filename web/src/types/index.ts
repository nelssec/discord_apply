export type {
  Guild,
  Form,
  Question,
  Application,
  ApplicationStatus,
  QuestionType,
} from '../../../shared/types';

export interface GuildWithBot {
  id: string;
  name: string;
  icon: string | null;
  hasBot: boolean;
  isAdmin: boolean;
}

export interface FormWithQuestions {
  form: import('../../../shared/types').Form;
  questions: import('../../../shared/types').Question[];
}

export interface ApplicationWithDetails {
  application: import('../../../shared/types').Application;
  form: import('../../../shared/types').Form;
  questions: import('../../../shared/types').Question[];
}
