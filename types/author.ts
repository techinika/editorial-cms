export interface Author {
  id: string;
  created_at: string;
  lang: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  external_link: string | null;
  image_ref: string | null;
  is_admin: boolean;
  title: string | null;
  username: string | null;
  location: string | null;
  x_handle: string | null;
  github_handle: string | null;
  linkedin_handle: string | null;
  role: string;
  active: boolean;
}
