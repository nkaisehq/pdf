import { GraphQLV1Cooperative } from '../../server/graphql/types/custom-types.js';
import { Account } from '../../server/graphql/types/v2/graphql.js';

/**
 * Displays the name for an account, using its legal name if available.
 */
const AccountName = ({ account }: { account: Account | GraphQLV1Cooperative }) => {
  return account.legalName || account.name || account.slug || 'Incognito';
};

export default AccountName;
