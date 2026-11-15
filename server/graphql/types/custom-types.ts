export type GraphQLV1Cooperative = {
  id: number;
  slug: string;
  name: string;
  legalName: string;
  type: 'COOPERATIVE' | 'EVENT' | 'USER' | 'ORGANIZATION' | 'BOT' | 'PROJECT' | 'FUND' | 'VENDOR';
  isArchived?: boolean;
  parentCooperative?: GraphQLV1Cooperative;
  settings?: Record<string, unknown>;
  isHost?: boolean;
  website: string;
  image: string;
};
