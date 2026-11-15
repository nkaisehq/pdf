import React from 'react';
import { View, Text, Image, Link, StyleSheet } from '@react-pdf/renderer';
import { GraphQLV1Cooperative } from '../../server/graphql/types/custom-types.js';
import { Account } from '../../server/graphql/types/v2/graphql.js';
import { imagePreview } from '../../server/lib/images.js';
import LocationParagraph from './LocationParagraph.js';
import { FontFamily, getFontStyleForText } from '../../server/lib/pdf.js';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    borderRight: '1 solid #E5E7EB',
    paddingRight: 16,
    marginRight: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  cooperativeName: {
    fontFamily: FontFamily.InterBold,
    fontSize: 12,
    marginBottom: 2,
  },
  address: {
    marginTop: 8,
    fontSize: 10,
    color: '#6B7280',
  },
});

const CooperativeFooter = ({ cooperative }: { cooperative: Account | GraphQLV1Cooperative }) => {
  const image = imagePreview(cooperative['imageUrl'] ?? cooperative['image'], null, { height: 200 });
  return (
    <View style={styles.container}>
      {image && (
        <View style={styles.logoContainer}>
          {cooperative.website ? (
            <Link src={cooperative.website}>
              <Image style={styles.logo} src={image} />
            </Link>
          ) : (
            <Image style={styles.logo} src={image} />
          )}
        </View>
      )}
      <View>
        <Text style={[styles.cooperativeName, getFontStyleForText(cooperative.legalName, cooperative.name)]}>
          {cooperative.legalName || cooperative.name || cooperative.slug}
        </Text>
        <View style={[styles.address, getFontStyleForText((cooperative as Account).location?.address)]}>
          <LocationParagraph cooperative={cooperative} />
        </View>
      </View>
    </View>
  );
};

export default CooperativeFooter;
