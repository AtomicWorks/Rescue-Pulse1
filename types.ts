

export type HelpCategory = 'Medical' | 'Fire' | 'Security' | 'Mechanical' | 'Other';

export type SeverityLevel = 'Low' | 'Medium' | 'High';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  skills?: string[];
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  category: HelpCategory;
  description: string;
  location: Location;
  timestamp: number;
  status: 'active' | 'resolved' | 'responding';
  responders: string[]; // IDs of users who are helping
  severity: SeverityLevel;
  isEmergency: boolean;
  isAnonymous?: boolean;
  voteScore?: number;
  upvoteCount?: number;
  userVote?: 1 | -1; // 1 = up, -1 = down
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  message: string;
  timestamp: number;
  is_read: boolean;
}

export interface AlertMessage {
  id: string;
  alert_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  created_at: string;
}

export interface AlertComment {
  id: string;
  alertId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}