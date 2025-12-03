const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3030/graphql';

export interface Profile {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
  location?: string | null;
  website?: string | null;
  createdAt?: string;
}

export interface CreatorProfile {
  id: string;
  isPublic: boolean;
  creatorBio?: string | null;
  primaryCategory?: string | null;
  highlights?: string | null;
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
          website
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
            website
            createdAt
          }
          creatorProfile {
            id
            isPublic
            creatorBio
            primaryCategory
            highlights
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
