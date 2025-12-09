export type PostStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

export type UserPublic = {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
};

export type CampaignLite = {
  id: string;
  title: string;
  description?: string | null;
  goalAmount?: number | null;
  raisedAmount?: number | null;
  isActive?: boolean | null;
};

export type PostLite = {
  id: string;
  title: string;
  content: string;
  status?: PostStatus;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  author?: Pick<UserPublic, "id" | "username" | "displayName">;
  campaign?: Pick<CampaignLite, "id" | "title"> | null;
};

export type PublicProfileDto = {
  user: UserPublic;
  campaignsCount: number;
  totalRaised: number;
};
