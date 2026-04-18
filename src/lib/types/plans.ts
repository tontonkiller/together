export type PlanStatus = 'open' | 'pending_tiebreak' | 'resolved' | 'expired';

export interface Plan {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  quorum: number;
  status: PlanStatus;
  resolved_slot_id: string | null;
  event_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PlanSlot {
  id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  position: number;
  created_at: string;
}

export interface PlanVote {
  id: string;
  slot_id: string;
  user_id: string;
  available: boolean;
  created_at: string;
}

export interface PlanSlotWithVotes extends PlanSlot {
  votes: PlanVote[];
}

export interface PlanWithSlots extends Plan {
  slots: PlanSlotWithVotes[];
  creator_profile: { display_name: string; avatar_url: string | null } | null;
}

export interface PlanSlotInput {
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  position: number;
}

export interface PlanInput {
  title: string;
  description: string | null;
  quorum: number;
  slots: PlanSlotInput[];
}

export interface VoteInput {
  slot_id: string;
  available: boolean;
}
