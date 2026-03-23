export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  is_private: boolean;
  user_id: string;
  event_type_id: string | null;
  event_types: { name: string; icon: string | null } | null;
}

export interface EventType {
  id: string;
  name: string;
  icon: string | null;
  is_system: boolean;
}
