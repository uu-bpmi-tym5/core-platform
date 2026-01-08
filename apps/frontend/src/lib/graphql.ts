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
  imageData?: string | null;
  endDate?: string | null;
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
          website
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
            imageData
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
          imageData
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
          imageData
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

export async function getCampaignById(campaignId: string) {
  return fetchGraphQL<{ campaign: Campaign }>(
    `
      query GetCampaignById($id: String!) {
        campaign(id: $id) {
          id
          name
          description
          imageData
          goal
          currentAmount
          category
          status
          endDate
          createdAt
          updatedAt
          creator {
            id
            email
          }
        }
      }
    `,
    { id: campaignId },
  );
}

export interface ContributionResult {
  id: string;
  campaignId: string;
  contributorId: string;
  amount: number;
  message?: string | null;
  createdAt: string;
}

export interface CampaignContribution {
  id: string;
  campaignId: string;
  contributorId: string;
  amount: number;
  message?: string | null;
  isRefunded: boolean;
  createdAt: string;
  contributor?: {
    id: string;
    email: string;
  };
}

export interface CampaignContributionStats {
  totalContributions: number;
  totalAmount: number;
  averageContribution: number;
  contributorsCount: number;
}

export async function contributeToCampaign(
  token: string | null,
  input: { campaignId: string; amount: number; message?: string }
) {
  return fetchGraphQL<{ contributeToCampaign: ContributionResult }>(
    `
      mutation ContributeToCampaign($input: ContributeToCampaignInput!) {
        contributeToCampaign(input: $input) {
          id
          campaignId
          contributorId
          amount
          message
          createdAt
        }
      }
    `,
    { input },
    token,
  );
}

export async function getCampaignContributions(token: string | null, campaignId: string) {
  return fetchGraphQL<{ campaignContributions: CampaignContribution[] }>(
    `
      query GetCampaignContributions($campaignId: String!) {
        campaignContributions(campaignId: $campaignId) {
          id
          campaignId
          contributorId
          amount
          message
          isRefunded
          createdAt
          contributor {
            id
            email
          }
        }
      }
    `,
    { campaignId },
    token,
  );
}

export async function getCampaignContributionStats(token: string | null, campaignId: string) {
  return fetchGraphQL<{ campaignContributionStats: CampaignContributionStats }>(
    `
      query GetCampaignContributionStats($campaignId: String!) {
        campaignContributionStats(campaignId: $campaignId) {
          totalContributions
          totalAmount
          averageContribution
          contributorsCount
        }
      }
    `,
    { campaignId },
    token,
  );
}

export async function getPublicCampaignStats(campaignId: string) {
  return fetchGraphQL<{ publicCampaignStats: CampaignContributionStats }>(
    `
      query GetPublicCampaignStats($campaignId: String!) {
        publicCampaignStats(campaignId: $campaignId) {
          totalContributions
          totalAmount
          averageContribution
          contributorsCount
        }
      }
    `,
    { campaignId },
  );
}

export async function updateCampaign(
  token: string | null,
  input: {
    id: string;
    name?: string;
    description?: string;
    goal?: number;
    category?: string;
  }
) {
  return fetchGraphQL<{ updateCampaign: Campaign }>(
    `
      mutation UpdateCampaign($input: UpdateCampaignInput!) {
        updateCampaign(updateCampaignInput: $input) {
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
    `,
    { input },
    token,
  );
}

export async function getMyCampaigns(token: string | null) {
  return fetchGraphQL<{ myCampaigns: Campaign[] }>(
    `
      query GetMyCampaigns {
        myCampaigns {
          id
          name
          status
        }
      }
    `,
    undefined,
    token,
  );
}


export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  campaignId: string;
  userId: string;
  status?: 'VISIBLE' | 'HIDDEN' | 'REMOVED';
  reportsCount?: number;
  lastReportedAt?: string | null;
  moderationReason?: string | null;
  moderatedBy?: string | null;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  campaign?: {
    id: string;
    name: string;
  };
}

export async function addComment(token: string | null, campaignId: string, content: string) {
  return fetchGraphQL<{ addComment: Comment }>(
    `
      mutation AddComment($campaignId: String!, $content: String!) {
        addComment(campaignId: $campaignId, content: $content) {
          id
          content
          createdAt
          user {
            id
            displayName
            avatarUrl
          }
        }
      }
    `,
    { campaignId, content },
    token
  );
}

export async function getComments(campaignId: string) {
  return fetchGraphQL<{ comments: Comment[] }>(
    `
      query GetComments($campaignId: String!) {
        comments(campaignId: $campaignId) {
          id
          content
          createdAt
          user {
            id
            displayName
            avatarUrl
          }
        }
      }
    `,
    { campaignId }
  );
}

export async function reportComment(token: string, commentId: string, reason?: string) {
  return fetchGraphQL<{ reportComment: boolean }>(
    `
      mutation ReportComment($input: ReportCommentInput!) {
        reportComment(input: $input)
      }
    `,
    { input: { commentId, reason } },
    token
  );
}

export async function deleteComment(token: string, commentId: string, reason?: string) {
  return fetchGraphQL<{ moderateComment: Comment }>(
    `
      mutation ModerateComment($input: ModerateCommentInput!) {
        moderateComment(input: $input) {
          id
          content
          createdAt
        }
      }
    `,
    { input: { commentId, action: 'REMOVE', reason } },
    token
  );
}

export async function hideComment(token: string, commentId: string, reason?: string) {
  return fetchGraphQL<{ moderateComment: Comment }>(
    `
      mutation ModerateComment($input: ModerateCommentInput!) {
        moderateComment(input: $input) {
          id
          content
          status
        }
      }
    `,
    { input: { commentId, action: 'HIDE', reason } },
    token
  );
}

export async function restoreComment(token: string, commentId: string) {
  return fetchGraphQL<{ moderateComment: Comment }>(
    `
      mutation ModerateComment($input: ModerateCommentInput!) {
        moderateComment(input: $input) {
          id
          content
          status
        }
      }
    `,
    { input: { commentId, action: 'RESTORE' } },
    token
  );
}

export async function getReportedComments(token: string) {
  return fetchGraphQL<{ reportedComments: Comment[] }>(
    `
      query GetReportedComments {
        reportedComments {
          id
          content
          createdAt
          campaignId
          userId
          status
          reportsCount
          lastReportedAt
          moderationReason
          user {
            id
            displayName
            avatarUrl
          }
          campaign {
            id
            name
          }
        }
      }
    `,
    undefined,
    token
  );
}

// Survey types and functions
export interface CampaignSurvey {
  id: string;
  campaignId: string;
  title: string;
  questions: string[];
  isActive: boolean;
  createdAt: string;
  closedAt?: string | null;
  creator: {
    id: string;
    email: string;
  };
}

export interface CampaignSurveyResponse {
  id: string;
  surveyId: string;
  answers: string[];
  createdAt: string;
  respondent: {
    id: string;
    email: string;
  };
}

export async function createCampaignSurvey(
  token: string,
  campaignId: string,
  title: string,
  questions: string[]
) {
  return fetchGraphQL<{ createCampaignSurvey: CampaignSurvey }>(
    `
      mutation CreateCampaignSurvey($input: CreateCampaignSurveyInput!) {
        createCampaignSurvey(input: $input) {
          id
          campaignId
          title
          questions
          isActive
          createdAt
        }
      }
    `,
    { input: { campaignId, title, questions } },
    token
  );
}

export async function getCampaignSurveys(campaignId: string) {
  return fetchGraphQL<{ campaignSurveys: CampaignSurvey[] }>(
    `
      query GetCampaignSurveys($campaignId: String!) {
        campaignSurveys(campaignId: $campaignId) {
          id
          campaignId
          title
          questions
          isActive
          createdAt
          closedAt
        }
      }
    `,
    { campaignId }
  );
}

export async function getSurveyById(surveyId: string) {
  return fetchGraphQL<{ campaignSurvey: CampaignSurvey }>(
    `
      query GetSurveyById($surveyId: String!) {
        campaignSurvey(surveyId: $surveyId) {
          id
          campaignId
          title
          questions
          isActive
          createdAt
          closedAt
        }
      }
    `,
    { surveyId }
  );
}

export async function submitSurveyResponse(token: string, surveyId: string, answers: string[]) {
  return fetchGraphQL<{ submitSurveyResponse: CampaignSurveyResponse }>(
    `
      mutation SubmitSurveyResponse($input: SubmitSurveyResponseInput!) {
        submitSurveyResponse(input: $input) {
          id
          surveyId
          answers
          createdAt
        }
      }
    `,
    { input: { surveyId, answers } },
    token
  );
}

export async function getSurveyResponses(token: string, surveyId: string) {
  return fetchGraphQL<{ surveyResponses: CampaignSurveyResponse[] }>(
    `
      query GetSurveyResponses($surveyId: String!) {
        surveyResponses(surveyId: $surveyId) {
          id
          answers
          createdAt
          respondent {
            id
            email
          }
        }
      }
    `,
    { surveyId },
    token
  );
}

export async function hasUserRespondedToSurvey(token: string, surveyId: string) {
  return fetchGraphQL<{ hasUserRespondedToSurvey: boolean }>(
    `
      query HasUserRespondedToSurvey($surveyId: String!) {
        hasUserRespondedToSurvey(surveyId: $surveyId)
      }
    `,
    { surveyId },
    token
  );
}

export async function closeSurvey(token: string, surveyId: string) {
  return fetchGraphQL<{ closeSurvey: CampaignSurvey }>(
    `
      mutation CloseSurvey($surveyId: String!) {
        closeSurvey(surveyId: $surveyId) {
          id
          isActive
          closedAt
        }
      }
    `,
    { surveyId },
    token
  );
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Notification types and functions
export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  userId: string;
  actionUrl?: string | null;
  metadata?: Record<string, string | number | boolean> | null;
  createdAt: string;
  updatedAt: string;
  readAt?: string | null;
}

export interface NotificationCount {
  total: number;
  unread: number;
}

export async function getMyNotifications(token: string) {
  return fetchGraphQL<{ getMyNotifications: Notification[] }>(
    `
      query GetMyNotifications {
        getMyNotifications {
          id
          title
          message
          type
          status
          userId
          actionUrl
          metadata
          createdAt
          updatedAt
          readAt
        }
      }
    `,
    {},
    token
  );
}

export async function getMyUnreadNotifications(token: string) {
  return fetchGraphQL<{ getMyUnreadNotifications: Notification[] }>(
    `
      query GetMyUnreadNotifications {
        getMyUnreadNotifications {
          id
          title
          message
          type
          status
          userId
          actionUrl
          metadata
          createdAt
          updatedAt
          readAt
        }
      }
    `,
    {},
    token
  );
}

export async function getNotificationCount(token: string) {
  return fetchGraphQL<{ getNotificationCount: NotificationCount }>(
    `
      query GetNotificationCount {
        getNotificationCount {
          total
          unread
        }
      }
    `,
    {},
    token
  );
}

export async function markNotificationAsRead(token: string, notificationId: string) {
  return fetchGraphQL<{ markNotificationAsRead: Notification }>(
    `
      mutation MarkNotificationAsRead($notificationId: String!) {
        markNotificationAsRead(notificationId: $notificationId) {
          id
          status
          readAt
        }
      }
    `,
    { notificationId },
    token
  );
}

export async function deleteNotification(token: string, id: string) {
  return fetchGraphQL<{ deleteNotification: boolean }>(
    `
      mutation DeleteNotification($id: String!) {
        deleteNotification(id: $id)
      }
    `,
    { id },
    token
  );
}

// ============= Audit Log Types =============

export type ActorType = 'user' | 'system';
export type AuditAction =
  | 'campaign.create'
  | 'campaign.update'
  | 'campaign.delete'
  | 'campaign.submit'
  | 'campaign.approve'
  | 'campaign.reject'
  | 'contribution.create'
  | 'contribution.refund'
  | 'wallet.deposit'
  | 'wallet.withdrawal'
  | 'user.register'
  | 'user.login'
  | 'user.logout'
  | 'user.update'
  | 'user.role_change'
  | 'user.password_change'
  | 'comment.create'
  | 'comment.delete'
  | 'comment.moderate'
  | 'comment.report'
  | 'notification.send'
  | 'export.contributions';

export interface AuditLogActor {
  id: string;
  name: string;
  email: string;
}

export interface AuditLog {
  id: string;
  createdAt: string;
  actorType: ActorType;
  actorId?: string | null;
  actor?: AuditLogActor | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  entityOwnerId?: string | null;
}

export interface AuditLogFilter {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogPagination {
  limit?: number;
  offset?: number;
}

// ============= Audit Log Functions =============

export async function getAuditLogs(
  token: string,
  filter?: AuditLogFilter,
  pagination?: AuditLogPagination
) {
  return fetchGraphQL<{ auditLogs: AuditLog[] }>(
    `
      query GetAuditLogs($filter: AuditLogFilterInput, $pagination: AuditLogPaginationInput) {
        auditLogs(filter: $filter, pagination: $pagination) {
          id
          createdAt
          actorType
          actorId
          actor {
            id
            name
            email
          }
          action
          entityType
          entityId
          description
          oldValues
          newValues
          metadata
          entityOwnerId
        }
      }
    `,
    { filter, pagination },
    token
  );
}

export async function getAuditLogsCount(token: string, filter?: AuditLogFilter) {
  return fetchGraphQL<{ auditLogsCount: number }>(
    `
      query GetAuditLogsCount($filter: AuditLogFilterInput) {
        auditLogsCount(filter: $filter)
      }
    `,
    { filter },
    token
  );
}

export async function getAuditLogById(token: string, id: string) {
  return fetchGraphQL<{ auditLog: AuditLog | null }>(
    `
      query GetAuditLog($id: String!) {
        auditLog(id: $id) {
          id
          createdAt
          actorType
          actorId
          actor {
            id
            name
            email
          }
          action
          entityType
          entityId
          description
          oldValues
          newValues
          metadata
          ipAddress
          userAgent
          entityOwnerId
        }
      }
    `,
    { id },
    token
  );
}

export async function getMyAuditLogs(
  token: string,
  filter?: AuditLogFilter,
  pagination?: AuditLogPagination
) {
  return fetchGraphQL<{ myAuditLogs: AuditLog[] }>(
    `
      query GetMyAuditLogs($filter: AuditLogFilterInput, $pagination: AuditLogPaginationInput) {
        myAuditLogs(filter: $filter, pagination: $pagination) {
          id
          createdAt
          actorType
          action
          entityType
          entityId
          description
        }
      }
    `,
    { filter, pagination },
    token
  );
}

export async function getAuditLogsForEntity(
  token: string,
  entityType: string,
  entityId: string,
  pagination?: AuditLogPagination
) {
  return fetchGraphQL<{ auditLogsForEntity: AuditLog[] }>(
    `
      query GetAuditLogsForEntity($entityType: String!, $entityId: String!, $pagination: AuditLogPaginationInput) {
        auditLogsForEntity(entityType: $entityType, entityId: $entityId, pagination: $pagination) {
          id
          createdAt
          actorType
          actorId
          actor {
            id
            name
            email
          }
          action
          description
          oldValues
          newValues
        }
      }
    `,
    { entityType, entityId, pagination },
    token
  );
}

// ============= Compliance Types =============

export type ComplianceRuleSeverity = 'BLOCKER' | 'WARNING' | 'INFO';
export type ComplianceCheckStatus = 'PASS' | 'FAIL' | 'WARN' | 'SKIPPED';
export type ComplianceRuleCategory = 'CONTENT' | 'FINANCIAL' | 'MEDIA' | 'LEGAL' | 'IDENTITY';

export interface ComplianceCheckResult {
  id: string;
  campaignId: string;
  runId: string;
  ruleId: string;
  ruleName: string;
  ruleCategory: ComplianceRuleCategory;
  ruleSeverity: ComplianceRuleSeverity;
  status: ComplianceCheckStatus;
  message: string;
  evidence?: string | null;
  moderatorNote?: string | null;
  checkedById?: string | null;
  checkedBy?: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export interface ComplianceRun {
  id: string;
  campaignId: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  blockerCount: number;
  canApprove: boolean;
  isOverridden: boolean;
  overrideReason?: string | null;
  overriddenById?: string | null;
  overriddenBy?: { id: string; name: string; email: string } | null;
  runById?: string | null;
  runBy?: { id: string; name: string; email: string } | null;
  createdAt: string;
  results?: ComplianceCheckResult[];
}

export interface ComplianceRuleDefinition {
  id: string;
  name: string;
  description: string;
  category: ComplianceRuleCategory;
  severity: ComplianceRuleSeverity;
}

export interface CampaignApprovalStatus {
  canApprove: boolean;
  reason: string;
  latestRun?: ComplianceRun | null;
}

// ============= Compliance Functions =============

export async function runComplianceChecks(token: string, campaignId: string) {
  return fetchGraphQL<{ runComplianceChecks: ComplianceRun }>(
    `
      mutation RunComplianceChecks($campaignId: String!) {
        runComplianceChecks(campaignId: $campaignId) {
          id
          campaignId
          totalChecks
          passedChecks
          failedChecks
          warningChecks
          blockerCount
          canApprove
          isOverridden
          createdAt
          runBy {
            id
            name
            email
          }
          results {
            id
            ruleId
            ruleName
            ruleCategory
            ruleSeverity
            status
            message
            evidence
            moderatorNote
          }
        }
      }
    `,
    { campaignId },
    token
  );
}

export async function getLatestComplianceRun(token: string, campaignId: string) {
  return fetchGraphQL<{ latestComplianceRun: ComplianceRun | null }>(
    `
      query GetLatestComplianceRun($campaignId: String!) {
        latestComplianceRun(campaignId: $campaignId) {
          id
          campaignId
          totalChecks
          passedChecks
          failedChecks
          warningChecks
          blockerCount
          canApprove
          isOverridden
          overrideReason
          createdAt
          runBy {
            id
            name
            email
          }
          overriddenBy {
            id
            name
            email
          }
          results {
            id
            ruleId
            ruleName
            ruleCategory
            ruleSeverity
            status
            message
            evidence
            moderatorNote
          }
        }
      }
    `,
    { campaignId },
    token
  );
}

export async function getCampaignApprovalStatus(token: string, campaignId: string) {
  return fetchGraphQL<{ campaignApprovalStatus: CampaignApprovalStatus }>(
    `
      query GetCampaignApprovalStatus($campaignId: String!) {
        campaignApprovalStatus(campaignId: $campaignId) {
          canApprove
          reason
          latestRun {
            id
            blockerCount
            isOverridden
          }
        }
      }
    `,
    { campaignId },
    token
  );
}

export async function overrideComplianceBlockers(token: string, runId: string, reason: string) {
  return fetchGraphQL<{ overrideComplianceBlockers: ComplianceRun }>(
    `
      mutation OverrideComplianceBlockers($runId: String!, $reason: String!) {
        overrideComplianceBlockers(runId: $runId, reason: $reason) {
          id
          canApprove
          isOverridden
          overrideReason
          overriddenBy {
            id
            name
            email
          }
        }
      }
    `,
    { runId, reason },
    token
  );
}

export async function addComplianceNote(token: string, checkResultId: string, note: string) {
  return fetchGraphQL<{ addComplianceNote: ComplianceCheckResult }>(
    `
      mutation AddComplianceNote($checkResultId: String!, $note: String!) {
        addComplianceNote(checkResultId: $checkResultId, note: $note) {
          id
          moderatorNote
          checkedById
        }
      }
    `,
    { checkResultId, note },
    token
  );
}

export async function getComplianceRules(token: string) {
  return fetchGraphQL<{ complianceRules: ComplianceRuleDefinition[] }>(
    `
      query GetComplianceRules {
        complianceRules {
          id
          name
          description
          category
          severity
        }
      }
    `,
    {},
    token
  );
}

