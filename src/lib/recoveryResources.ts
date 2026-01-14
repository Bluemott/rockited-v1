export type ResourceCategory = 
  | 'Crisis Support'
  | '12-Step Programs'
  | 'Treatment Centers'
  | 'Online Resources'
  | 'Government Resources'
  | 'Support Groups'
  | 'Helplines';

export interface RecoveryResource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  phone?: string;
  email?: string;
  website?: string;
}

export const resourceCategories: ResourceCategory[] = [
  'Crisis Support',
  '12-Step Programs',
  'Treatment Centers',
  'Online Resources',
  'Government Resources',
  'Support Groups',
  'Helplines',
];

export const recoveryResources: RecoveryResource[] = [
  // Crisis Support
  {
    id: '988-suicide',
    name: '988 Suicide & Crisis Lifeline',
    category: 'Crisis Support',
    description: 'Free, confidential 24/7 support for people in distress, prevention and crisis resources.',
    phone: '988',
    website: 'https://988lifeline.org',
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    category: 'Crisis Support',
    description: 'Free 24/7 crisis support via text message. Text HOME to 741741.',
    phone: '741741',
    website: 'https://www.crisistextline.org',
  },
  {
    id: 'samhsa-helpline',
    name: 'SAMHSA National Helpline',
    category: 'Crisis Support',
    description: 'Free, confidential, 24/7 treatment referral and information service for individuals and families facing mental and/or substance use disorders.',
    phone: '1-800-662-4357',
    website: 'https://www.samhsa.gov/find-help/national-helpline',
  },

  // 12-Step Programs
  {
    id: 'aa',
    name: 'Alcoholics Anonymous',
    category: '12-Step Programs',
    description: 'A worldwide fellowship of men and women who help each other stay sober. Free to all who want to recover from alcoholism.',
    phone: '212-870-3400',
    website: 'https://www.aa.org',
    email: 'info@aa.org',
  },
  {
    id: 'na',
    name: 'Narcotics Anonymous',
    category: '12-Step Programs',
    description: 'A global, community-based organization with a multi-lingual and multicultural membership. NA was founded in 1953.',
    website: 'https://www.na.org',
  },
  {
    id: 'ca',
    name: 'Cocaine Anonymous',
    category: '12-Step Programs',
    description: 'A fellowship of men and women who share their experience, strength, and hope with each other to solve their common problem.',
    website: 'https://www.ca.org',
  },
  {
    id: 'ga',
    name: 'Gamblers Anonymous',
    category: '12-Step Programs',
    description: 'A fellowship of men and women who share their experience, strength, and hope with each other to solve their common problem with gambling.',
    website: 'https://www.gamblersanonymous.org',
  },
  {
    id: 'oa',
    name: 'Overeaters Anonymous',
    category: '12-Step Programs',
    description: 'A fellowship of individuals who, through shared experience, strength, and hope, are recovering from compulsive overeating.',
    website: 'https://oa.org',
  },
  {
    id: 'sa',
    name: 'Sex Addicts Anonymous',
    category: '12-Step Programs',
    description: 'A fellowship of men and women who share their experience, strength, and hope with each other to solve their common problem.',
    website: 'https://saa-recovery.org',
  },

  // Treatment Centers
  {
    id: 'hazelden',
    name: 'Hazelden Betty Ford Foundation',
    category: 'Treatment Centers',
    description: 'One of the nation\'s leading nonprofit addiction treatment, mental health, and recovery organizations.',
    phone: '1-800-257-7810',
    website: 'https://www.hazeldenbettyford.org',
  },
  {
    id: 'caron',
    name: 'Caron Treatment Centers',
    category: 'Treatment Centers',
    description: 'A nationally recognized nonprofit dedicated to addiction and behavioral healthcare treatment, prevention, and education.',
    phone: '1-800-854-6023',
    website: 'https://www.caron.org',
  },

  // Online Resources
  {
    id: 'in-the-rooms',
    name: 'In The Rooms',
    category: 'Online Resources',
    description: 'A free online recovery tool offering 130 weekly online meetings for those recovering from addiction and related issues.',
    website: 'https://www.intherooms.com',
  },
  {
    id: 'smart-recovery',
    name: 'SMART Recovery',
    category: 'Online Resources',
    description: 'A science-based program that helps people recover from addiction through self-empowerment and self-reliance.',
    website: 'https://www.smartrecovery.org',
  },
  {
    id: 'recovery-org',
    name: 'Recovery.org',
    category: 'Online Resources',
    description: 'Comprehensive directory of addiction treatment centers, support groups, and recovery resources.',
    website: 'https://www.recovery.org',
  },

  // Government Resources
  {
    id: 'samhsa',
    name: 'SAMHSA',
    category: 'Government Resources',
    description: 'Substance Abuse and Mental Health Services Administration - Leading public health agency focused on behavioral health.',
    phone: '1-800-662-4357',
    website: 'https://www.samhsa.gov',
  },
  {
    id: 'niaaa',
    name: 'NIAAA',
    category: 'Government Resources',
    description: 'National Institute on Alcohol Abuse and Alcoholism - Provides leadership in the national effort to reduce alcohol-related problems.',
    website: 'https://www.niaaa.nih.gov',
  },
  {
    id: 'nida',
    name: 'NIDA',
    category: 'Government Resources',
    description: 'National Institute on Drug Abuse - Leads the nation in bringing the power of science to bear on drug abuse and addiction.',
    website: 'https://www.nida.nih.gov',
  },
  {
    id: 'va-substance-abuse',
    name: 'VA Substance Use Disorder Program',
    category: 'Government Resources',
    description: 'Comprehensive substance use disorder treatment services for Veterans.',
    phone: '1-800-827-1000',
    website: 'https://www.mentalhealth.va.gov/substance-use/index.asp',
  },

  // Support Groups
  {
    id: 'al-anon',
    name: 'Al-Anon Family Groups',
    category: 'Support Groups',
    description: 'A mutual support program for people whose lives have been affected by someone else\'s drinking.',
    phone: '1-888-4AL-ANON',
    website: 'https://al-anon.org',
  },
  {
    id: 'nar-anon',
    name: 'Nar-Anon Family Groups',
    category: 'Support Groups',
    description: 'A twelve-step program for friends and family members of those who are addicted to drugs or alcohol.',
    website: 'https://www.nar-anon.org',
  },
  {
    id: 'adult-children',
    name: 'Adult Children of Alcoholics',
    category: 'Support Groups',
    description: 'A Twelve Step, Twelve Tradition program of people who grew up in an alcoholic or otherwise dysfunctional home.',
    website: 'https://adultchildren.org',
  },

  // Helplines
  {
    id: 'national-drug-helpline',
    name: 'National Drug Helpline',
    category: 'Helplines',
    description: '24/7 confidential helpline providing information, support, and referrals for substance abuse issues.',
    phone: '1-844-289-0879',
    website: 'https://drughelpline.org',
  },
  {
    id: 'partnership-drugfree',
    name: 'Partnership to End Addiction',
    category: 'Helplines',
    description: 'Provides personalized support and resources for families struggling with their son\'s or daughter\'s substance use.',
    phone: '1-855-378-4373',
    website: 'https://drugfree.org',
  },
];
