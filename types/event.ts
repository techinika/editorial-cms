export type EventStatus = "Upcoming" | "Past" | "Featured" | "Happening";

export const EVENT_FORMATS = [
  "Webinar",
  "Conference",
  "Workshop",
  "Networking",
  "Launch",
  "Hackathon",
] as const;

export type EventFormat = (typeof EVENT_FORMATS)[number];

export const EVENT_STATUSES: EventStatus[] = [
  "Upcoming",
  "Happening",
  "Past",
  "Featured",
];

export interface EventFormData {
  title: string;
  slug: string;
  lang: string;
  location: string | null;
  format: EventFormat;
  status: EventStatus;
  publish_status: "draft" | "published";
  start_date: string | null;
  end_date: string | null;
  seo_description: string | null;
  full_description: string | null;
  tags: string | null;
  external_link: string | null;
  organizer_id: string | null;
  contact_person_id: string | null;
  is_featured: boolean;
  views: number;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
}
