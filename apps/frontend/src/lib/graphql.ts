const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3030/graphql';

export interface Profile {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
  location?: string | null;
  createdAt?: string;
}

export interface CreatorProfile {
  id: string;
  isPublic: boolean;
  creatorBio?: string | null;
  primaryCategory?: string | null;
  highlights?: string | null;
  website?: string | null;
}

export interface PublicProfile {
  profile: Profile;
  creatorProfile?: CreatorProfile | null;
  campaigns: {
    id: string;
    name: string;
    description: string;
    goal: number;
    currentAmount: number;
    category: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'CAMPAIGN_CONTRIBUTION' | 'REFUND' | 'BANK_WITHDRAWAL';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface WalletTX {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  campaignId?: string | null;
  description?: string | null;
  externalReference?: string | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  currentAmount: number;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    email: string;
  };
}

async function fetchGraphQL<T>(query: string, variables?: Record<string, unknown>, token?: string | null): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (json.errors) {
    const message = (json.errors as { message?: string }[]).map((e) => e.message ?? 'Unknown error').join(', ');
    throw new Error(message || 'GraphQL error');
  }
  return json.data as T;
}

export async function getMyProfile(token: string | null) {
  return fetchGraphQL<{ myProfile: Profile }>(
    `
      query MyProfile {
        myProfile {
          id
          userId
          slug
          displayName
          avatarUrl
          location
        }
      }
    `,
    undefined,
    token,
  );
}

export async function updateMyProfile(token: string | null, input: Partial<Profile> & { slug?: string }) {
  return fetchGraphQL<{ updateMyProfile: Profile }>(
    `
      mutation UpdateMyProfile($input: UpdateProfileInput!) {
        updateMyProfile(input: $input) {
          id
          userId
          slug
          displayName
          avatarUrl
          location
          website
        }
      }
    `,
    { input },
    token,
  );
}

export async function getMyCreatorProfile(token: string | null) {
  return fetchGraphQL<{ myCreatorProfile: CreatorProfile | null }>(
    `
      query MyCreatorProfile {
        myCreatorProfile {
          id
          isPublic
          creatorBio
          primaryCategory
          highlights
        }
      }
    `,
    undefined,
    token,
  );
}

export async function updateMyCreatorProfile(
  token: string | null,
  input: {
    isPublic?: boolean;
    creatorBio?: string;
    primaryCategory?: string;
    highlights?: string;
    website?: string;
  },
) {
  return fetchGraphQL<{ updateMyCreatorProfile: CreatorProfile }>(
    `
      mutation UpdateMyCreatorProfile($input: UpdateCreatorProfileInput!) {
        updateMyCreatorProfile(input: $input) {
          id
          isPublic
          creatorBio
          primaryCategory
          highlights
          website
        }
      }
    `,
    { input },
    token,
  );
}

export async function getPublicProfileBySlug(slug: string) {
  return fetchGraphQL<{ publicProfileBySlug: PublicProfile }>(
    `
      query PublicProfileBySlug($slug: String!) {
        publicProfileBySlug(slug: $slug) {
          profile {
            id
            userId
            slug
            displayName
            avatarUrl
            location
            createdAt
          }
          creatorProfile {
            id
            isPublic
            creatorBio
            primaryCategory
            highlights
            website
          }
          campaigns {
            id
            name
            description
            goal
            currentAmount
            category
            status
            createdAt
            updatedAt
          }
        }
      }
    `,
    { slug },
  );
}

export async function getWalletBalance(token: string | null) {
  return fetchGraphQL<{ walletBalance: number }>(
    `
      query WalletBalance { 
        walletBalance 
      }
    `,
    undefined,
    token,
  );
}

export async function getWalletTransactions(token: string | null) {
  return fetchGraphQL<{ walletTransactions: WalletTX[] }>(
    `
      query WalletTransactions {
        walletTransactions {
          id
          userId
          type
          amount
          status
          campaignId
          description
          externalReference
          createdAt
        }
      }
    `,
    undefined,
    token,
  );
}

export async function depositMoney(token: string | null, amount: number, externalReference?: string) {
  return fetchGraphQL<{ depositMoney: WalletTX }>(
    `
      mutation DepositMoney($amount: Float!, $externalReference: String) {
        depositMoney(amount: $amount, externalReference: $externalReference) {
          id
          userId
          type
          amount
          status
          description
          externalReference
          createdAt
        }
      }
    `,
    { amount, externalReference },
    token,
  );
}

export async function withdrawToBank(
  token: string | null,
  input: { amount: number; bankAccount: string; description?: string }
) {
  return fetchGraphQL<{ withdrawToBank: WalletTX }>(
    `
      mutation WithdrawToBank($input: BankWithdrawalInput!) {
        withdrawToBank(input: $input) {
          id
          userId
          type
          amount
          status
          description
          externalReference
          createdAt
        }
      }
    `,
    { input },
    token,
  );
}

export async function getPublicCampaigns() {
  return fetchGraphQL<{ campaigns: Campaign[] }>(
    `
      query GetPublicCampaigns {
        campaigns {
          id
          name
          description
          goal
          currentAmount
          category
          status
          createdAt
          updatedAt
          creator {
            id
            email
          }
        }
      }
    `,
  );
}

// Admin functions
export async function getPendingCampaigns(token: string) {
  return fetchGraphQL<{ pendingCampaigns: Campaign[] }>(
    `
      query GetPendingCampaigns {
        pendingCampaigns {
          id
          name
          description
          goal
          currentAmount
          category
          status
          createdAt
          updatedAt
          creator {
            id
            email
          }
        }
      }
    `,
    undefined,
    token,
  );
}

export async function approveCampaign(token: string, campaignId: string) {
  return fetchGraphQL<{ approveCampaign: Campaign }>(
    `
      mutation ApproveCampaign($campaignId: String!) {
        approveCampaign(campaignId: $campaignId) {
          id
          name
          status
        }
      }
    `,
    { campaignId },
    token,
  );
}

export async function rejectCampaign(token: string, campaignId: string) {
  return fetchGraphQL<{ rejectCampaign: Campaign }>(
    `
      mutation RejectCampaign($campaignId: String!) {
        rejectCampaign(campaignId: $campaignId) {
          id
          name
          status
        }
      }
    `,
    { campaignId },
    token,
  );
}

