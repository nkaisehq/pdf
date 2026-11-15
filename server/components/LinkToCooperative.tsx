import React from 'react';
import { FormattedMessage } from 'react-intl';
import AccountName from './AccountName.js';
import { Link } from '@react-pdf/renderer';
import { Account } from '../../server/graphql/types/v2/graphql.js';
import { GraphQLV1Cooperative } from '../../server/graphql/types/custom-types.js';

import { get } from 'lodash-es';

/**
 * Returns event's parent cooperative slug. If the parent is not available,
 * fallback on `cooperative` slug which will result in a valid URL: parent
 * cooperative slug is only used to generate pretty URLs.
 */
const getEventParentCooperativeSlug = (event: Account | GraphQLV1Cooperative) => {
  const parentSlug =
    get(event, 'parentCooperative.slug') || get(event, 'parentAccount.slug') || get(event, 'parent.slug');
  return parentSlug || 'cooperative';
};

const LinkToCooperative = ({
  cooperative,
  children,
  ...props
}: {
  cooperative: Account | GraphQLV1Cooperative;
  children?: React.ReactNode;
} & React.ComponentProps<typeof Link>) => {
  const { type, slug } = cooperative;

  if (!cooperative) {
    return children || <FormattedMessage id="Sp8UUp" defaultMessage="Incognito" />;
  }

  return type !== 'EVENT' ? (
    <Link src={`https://betterlife.com/${slug}`} {...props}>
      {children || <AccountName account={cooperative} />}
    </Link>
  ) : (
    <Link src={`https://betterlife.com/${getEventParentCooperativeSlug(cooperative)}/events/${slug}`} {...props}>
      {children || <AccountName account={cooperative} />}
    </Link>
  );
};

export default LinkToCooperative;
