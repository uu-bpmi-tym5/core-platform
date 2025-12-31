import { ComplianceRuleSeverity, ComplianceRuleCategory, ComplianceCheckStatus } from '../entities/compliance.entity';
import { Campaign } from '../entities/campaign.entity';

/**
 * Compliance rule definition
 */
export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: ComplianceRuleCategory;
  severity: ComplianceRuleSeverity;
  check: (campaign: Campaign) => ComplianceCheckResult;
}

/**
 * Result from running a compliance check
 */
export interface ComplianceCheckResult {
  status: ComplianceCheckStatus;
  message: string;
  evidence?: string;
}

/**
 * Predefined compliance rules for campaign verification
 */
export const COMPLIANCE_RULES: ComplianceRule[] = [
  // ==================== CONTENT RULES ====================
  {
    id: 'CONTENT_TITLE_LENGTH',
    name: 'Title Length Check',
    description: 'Campaign title must be between 10 and 100 characters',
    category: ComplianceRuleCategory.CONTENT,
    severity: ComplianceRuleSeverity.BLOCKER,
    check: (campaign: Campaign) => {
      const length = campaign.name?.trim().length || 0;
      if (length < 10) {
        return {
          status: ComplianceCheckStatus.FAIL,
          message: `Title is too short (${length} characters). Minimum 10 characters required.`,
          evidence: `Current title: "${campaign.name}"`,
        };
      }
      if (length > 100) {
        return {
          status: ComplianceCheckStatus.FAIL,
          message: `Title is too long (${length} characters). Maximum 100 characters allowed.`,
          evidence: `Current title length: ${length}`,
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: `Title length is acceptable (${length} characters)`,
        evidence: `Title: "${campaign.name}"`,
      };
    },
  },
  {
    id: 'CONTENT_DESCRIPTION_LENGTH',
    name: 'Description Length Check',
    description: 'Campaign description must be at least 100 characters',
    category: ComplianceRuleCategory.CONTENT,
    severity: ComplianceRuleSeverity.BLOCKER,
    check: (campaign: Campaign) => {
      const length = campaign.description?.trim().length || 0;
      if (length < 100) {
        return {
          status: ComplianceCheckStatus.FAIL,
          message: `Description is too short (${length} characters). Minimum 100 characters required for a quality campaign.`,
          evidence: `Current description length: ${length} characters`,
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: `Description length is acceptable (${length} characters)`,
      };
    },
  },
  {
    id: 'CONTENT_DESCRIPTION_QUALITY',
    name: 'Description Quality Check',
    description: 'Description should contain multiple sentences and proper formatting',
    category: ComplianceRuleCategory.CONTENT,
    severity: ComplianceRuleSeverity.WARNING,
    check: (campaign: Campaign) => {
      const description = campaign.description?.trim() || '';
      const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);

      if (sentences.length < 3) {
        return {
          status: ComplianceCheckStatus.WARN,
          message: `Description has only ${sentences.length} sentence(s). Consider adding more detail.`,
          evidence: `Sentence count: ${sentences.length}`,
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: `Description has good structure (${sentences.length} sentences)`,
      };
    },
  },
  {
    id: 'CONTENT_NO_PROHIBITED_WORDS',
    name: 'Prohibited Content Check',
    description: 'Campaign must not contain prohibited or inappropriate words',
    category: ComplianceRuleCategory.CONTENT,
    severity: ComplianceRuleSeverity.BLOCKER,
    check: (campaign: Campaign) => {
      const prohibitedWords = [
        'guaranteed returns',
        'get rich quick',
        'pyramid',
        'ponzi',
        'multi-level marketing',
        'mlm',
        'investment opportunity',
      ];

      const content = `${campaign.name} ${campaign.description}`.toLowerCase();
      const foundWords = prohibitedWords.filter(word => content.includes(word.toLowerCase()));

      if (foundWords.length > 0) {
        return {
          status: ComplianceCheckStatus.FAIL,
          message: `Campaign contains prohibited phrases that suggest investment schemes or misleading content.`,
          evidence: `Found prohibited phrases: ${foundWords.join(', ')}`,
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: 'No prohibited content detected',
      };
    },
  },
  {
    id: 'CONTENT_CATEGORY_VALID',
    name: 'Category Validation',
    description: 'Campaign must have a valid category',
    category: ComplianceRuleCategory.CONTENT,
    severity: ComplianceRuleSeverity.BLOCKER,
    check: (campaign: Campaign) => {
      const validCategories = [
        'Technology',
        'Health',
        'Education',
        'Environment',
        'Arts',
        'Community',
        'Sports',
        'Business',
        'Charity',
        'Other',
      ];

      if (!campaign.category || campaign.category.trim().length === 0) {
        return {
          status: ComplianceCheckStatus.FAIL,
          message: 'Campaign must have a category selected',
        };
      }

      // Check if category is in the list (case-insensitive)
      const isValid = validCategories.some(
        cat => cat.toLowerCase() === campaign.category.toLowerCase()
      );

      if (!isValid) {
        return {
          status: ComplianceCheckStatus.WARN,
          message: `Category "${campaign.category}" is not a standard category. Consider using a predefined category.`,
          evidence: `Valid categories: ${validCategories.join(', ')}`,
        };
      }

      return {
        status: ComplianceCheckStatus.PASS,
        message: `Category "${campaign.category}" is valid`,
      };
    },
  },

  // ==================== FINANCIAL RULES ====================
  {
    id: 'FINANCIAL_GOAL_MINIMUM',
    name: 'Minimum Goal Amount',
    description: 'Campaign goal must be at least $100',
    category: ComplianceRuleCategory.FINANCIAL,
    severity: ComplianceRuleSeverity.BLOCKER,
    check: (campaign: Campaign) => {
      const goal = Number(campaign.goal) || 0;
      if (goal < 100) {
        return {
          status: ComplianceCheckStatus.FAIL,
          message: `Goal amount ($${goal}) is below minimum. Campaigns must have a goal of at least $100.`,
          evidence: `Current goal: $${goal}`,
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: `Goal amount ($${goal.toLocaleString()}) meets minimum requirement`,
      };
    },
  },
  {
    id: 'FINANCIAL_GOAL_MAXIMUM',
    name: 'Maximum Goal Amount',
    description: 'Campaign goal should not exceed $10,000,000',
    category: ComplianceRuleCategory.FINANCIAL,
    severity: ComplianceRuleSeverity.WARNING,
    check: (campaign: Campaign) => {
      const goal = Number(campaign.goal) || 0;
      if (goal > 10000000) {
        return {
          status: ComplianceCheckStatus.WARN,
          message: `Goal amount ($${goal.toLocaleString()}) is unusually high. May require additional verification.`,
          evidence: `Current goal: $${goal.toLocaleString()}`,
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: `Goal amount ($${goal.toLocaleString()}) is within normal range`,
      };
    },
  },
  {
    id: 'FINANCIAL_GOAL_REASONABLE',
    name: 'Goal Reasonability Check',
    description: 'Goal amount should be reasonable for the description length',
    category: ComplianceRuleCategory.FINANCIAL,
    severity: ComplianceRuleSeverity.INFO,
    check: (campaign: Campaign) => {
      const goal = Number(campaign.goal) || 0;
      const descriptionLength = campaign.description?.length || 0;

      // Rough heuristic: high goals should have detailed descriptions
      if (goal > 50000 && descriptionLength < 500) {
        return {
          status: ComplianceCheckStatus.WARN,
          message: `High goal amount ($${goal.toLocaleString()}) with relatively short description. Consider requesting more details.`,
          evidence: `Goal: $${goal.toLocaleString()}, Description: ${descriptionLength} chars`,
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: 'Goal amount is proportional to campaign detail',
      };
    },
  },

  // ==================== MEDIA RULES ====================
  {
    id: 'MEDIA_HAS_IMAGE',
    name: 'Campaign Image Check',
    description: 'Campaign should have an image',
    category: ComplianceRuleCategory.MEDIA,
    severity: ComplianceRuleSeverity.WARNING,
    check: (campaign: Campaign) => {
      if (!campaign.imageData || campaign.imageData.trim().length === 0) {
        return {
          status: ComplianceCheckStatus.WARN,
          message: 'Campaign has no image. Campaigns with images typically perform better.',
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: 'Campaign has an image',
      };
    },
  },
  {
    id: 'MEDIA_IMAGE_SIZE',
    name: 'Image Size Check',
    description: 'Campaign image should not be too large',
    category: ComplianceRuleCategory.MEDIA,
    severity: ComplianceRuleSeverity.INFO,
    check: (campaign: Campaign) => {
      if (!campaign.imageData) {
        return {
          status: ComplianceCheckStatus.SKIPPED,
          message: 'No image to check',
        };
      }

      // Base64 image size check (rough estimate)
      const sizeInBytes = (campaign.imageData.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB > 5) {
        return {
          status: ComplianceCheckStatus.WARN,
          message: `Image is large (${sizeInMB.toFixed(2)} MB). Consider optimizing for faster loading.`,
          evidence: `Image size: ${sizeInMB.toFixed(2)} MB`,
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: `Image size is acceptable (${sizeInMB.toFixed(2)} MB)`,
      };
    },
  },

  // ==================== DEADLINE RULES ====================
  {
    id: 'DEADLINE_SET',
    name: 'End Date Check',
    description: 'Campaign should have an end date set',
    category: ComplianceRuleCategory.FINANCIAL,
    severity: ComplianceRuleSeverity.WARNING,
    check: (campaign: Campaign) => {
      if (!campaign.endDate) {
        return {
          status: ComplianceCheckStatus.WARN,
          message: 'Campaign has no end date. Consider setting a deadline to create urgency.',
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: `Campaign ends on ${new Date(campaign.endDate).toLocaleDateString()}`,
      };
    },
  },
  {
    id: 'DEADLINE_FUTURE',
    name: 'Future End Date Check',
    description: 'Campaign end date must be in the future',
    category: ComplianceRuleCategory.FINANCIAL,
    severity: ComplianceRuleSeverity.BLOCKER,
    check: (campaign: Campaign) => {
      if (!campaign.endDate) {
        return {
          status: ComplianceCheckStatus.SKIPPED,
          message: 'No end date set',
        };
      }

      const endDate = new Date(campaign.endDate);
      const now = new Date();

      if (endDate <= now) {
        return {
          status: ComplianceCheckStatus.FAIL,
          message: 'Campaign end date has already passed',
          evidence: `End date: ${endDate.toLocaleDateString()}, Current date: ${now.toLocaleDateString()}`,
        };
      }

      // Check if end date is too soon (less than 7 days)
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilEnd < 7) {
        return {
          status: ComplianceCheckStatus.WARN,
          message: `Campaign ends in ${daysUntilEnd} days. This may not be enough time to reach the goal.`,
          evidence: `Days until end: ${daysUntilEnd}`,
        };
      }

      return {
        status: ComplianceCheckStatus.PASS,
        message: `Campaign has ${daysUntilEnd} days remaining`,
      };
    },
  },
  {
    id: 'DEADLINE_REASONABLE_DURATION',
    name: 'Campaign Duration Check',
    description: 'Campaign duration should be between 7 and 365 days',
    category: ComplianceRuleCategory.FINANCIAL,
    severity: ComplianceRuleSeverity.INFO,
    check: (campaign: Campaign) => {
      if (!campaign.endDate) {
        return {
          status: ComplianceCheckStatus.SKIPPED,
          message: 'No end date set',
        };
      }

      const endDate = new Date(campaign.endDate);
      const createdAt = new Date(campaign.createdAt);
      const durationDays = Math.ceil((endDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (durationDays > 365) {
        return {
          status: ComplianceCheckStatus.WARN,
          message: `Campaign duration is ${durationDays} days. Very long campaigns may lose momentum.`,
        };
      }

      return {
        status: ComplianceCheckStatus.PASS,
        message: `Campaign duration is ${durationDays} days`,
      };
    },
  },

  // ==================== IDENTITY RULES ====================
  {
    id: 'IDENTITY_CREATOR_EXISTS',
    name: 'Creator Exists',
    description: 'Campaign must have a valid creator',
    category: ComplianceRuleCategory.IDENTITY,
    severity: ComplianceRuleSeverity.BLOCKER,
    check: (campaign: Campaign) => {
      if (!campaign.creatorId) {
        return {
          status: ComplianceCheckStatus.FAIL,
          message: 'Campaign has no creator assigned',
        };
      }
      return {
        status: ComplianceCheckStatus.PASS,
        message: 'Campaign has a valid creator',
        evidence: `Creator ID: ${campaign.creatorId}`,
      };
    },
  },
];

/**
 * Get all compliance rules
 */
export function getAllComplianceRules(): ComplianceRule[] {
  return COMPLIANCE_RULES;
}

/**
 * Get compliance rules by category
 */
export function getComplianceRulesByCategory(category: ComplianceRuleCategory): ComplianceRule[] {
  return COMPLIANCE_RULES.filter(rule => rule.category === category);
}

/**
 * Get compliance rules by severity
 */
export function getComplianceRulesBySeverity(severity: ComplianceRuleSeverity): ComplianceRule[] {
  return COMPLIANCE_RULES.filter(rule => rule.severity === severity);
}

/**
 * Get a specific rule by ID
 */
export function getComplianceRuleById(id: string): ComplianceRule | undefined {
  return COMPLIANCE_RULES.find(rule => rule.id === id);
}

