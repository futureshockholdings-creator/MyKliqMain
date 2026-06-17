#!/usr/bin/env node
/**
 * setup-ios-credentials.js
 * Programmatically creates and uploads iOS credentials to EAS using an ASC API key.
 * Run from the mobile/ directory: node scripts/setup-ios-credentials.js
 */
'use strict';

const path = require('path');
const fs   = require('fs');

// ── Config ─────────────────────────────────────────────────────────────────
const EXPO_TOKEN    = process.env.EXPO_TOKEN;
const ACCOUNT_NAME  = 'futureshockholdings';
const ACCOUNT_ID    = '7b6799c6-3df8-4733-be3f-98927f586281';
const PROJECT_NAME  = 'mykliq-mobile';
const BUNDLE_ID     = 'com.mykliq.app';
const TEAM_ID       = '7S3JDKMQRG';
const ASC_KEY_PATH  = process.env.EXPO_ASC_API_KEY_PATH || '/tmp/asc_api_key_proper.p8';
const ASC_KEY_ID    = process.env.EXPO_ASC_KEY_ID    || process.env.ASC_API_KEY_ID;
const ASC_ISSUER_ID = process.env.EXPO_ASC_ISSUER_ID || process.env.ASC_API_KEY_ISSUER_ID;

const EAS = path.resolve(__dirname, '../node_modules/eas-cli/build');

if (!EXPO_TOKEN)    { console.error('EXPO_TOKEN is required');   process.exit(1); }
if (!ASC_KEY_ID)    { console.error('ASC key ID is required');   process.exit(1); }
if (!ASC_ISSUER_ID) { console.error('ASC issuer ID is required'); process.exit(1); }
if (!fs.existsSync(ASC_KEY_PATH)) { console.error(`Key file not found: ${ASC_KEY_PATH}`); process.exit(1); }

// ── Internal EAS modules ────────────────────────────────────────────────────
const { createGraphqlClient }    = require(`${EAS}/commandUtils/context/contextUtils/createGraphqlClient`);
const { authenticateAsync }      = require(`${EAS}/credentials/ios/appstore/authenticate`);
const { AuthenticationMode, AppleTeamType } = require(`${EAS}/credentials/ios/appstore/authenticateTypes`);
const { createDistributionCertificateAsync, listDistributionCertificatesAsync } = require(`${EAS}/credentials/ios/appstore/distributionCertificate`);
const { createProvisioningProfileAsync, ProfileClass } = require(`${EAS}/credentials/ios/appstore/provisioningProfile`);
const { ensureBundleIdExistsWithNameAsync } = require(`${EAS}/credentials/ios/appstore/ensureAppExists`);
const { ApplePlatform }          = require(`${EAS}/credentials/ios/appstore/constants`);
const GQL                        = require(`${EAS}/credentials/ios/api/GraphqlClient`);
const { IosDistributionType }    = require(`${EAS}/graphql/generated`);

async function main() {
  console.log('=== MyKliq iOS Credential Setup ===\n');

  const account        = { id: ACCOUNT_ID, name: ACCOUNT_NAME };
  const appLookupParams = { account, projectName: PROJECT_NAME, bundleIdentifier: BUNDLE_ID };

  // 1. GraphQL client
  console.log('1. Creating EAS GraphQL client...');
  const gql = createGraphqlClient({ accessToken: EXPO_TOKEN });

  // 2. Authenticate with Apple via ASC API key
  console.log('2. Authenticating with Apple (ASC API key)...');
  const keyP8 = fs.readFileSync(ASC_KEY_PATH, 'utf-8');
  const authCtx = await authenticateAsync({
    mode:     AuthenticationMode.API_KEY,
    ascApiKey: { keyP8, keyId: ASC_KEY_ID, issuerId: ASC_ISSUER_ID },
    teamId:   TEAM_ID,
    teamType: AppleTeamType.COMPANY_OR_ORGANIZATION,
  });
  console.log(`   Team: ${authCtx.team.id}`);

  // 3. Get or create the Distribution Certificate
  console.log('3. Resolving Distribution Certificate...');
  let easDistCert;
  const existingEasCerts = await GQL.getDistributionCertificatesForAccountAsync(gql, account);

  if (existingEasCerts.length > 0) {
    // Reuse most-recently-uploaded cert on EAS
    easDistCert = existingEasCerts[0];
    console.log(`   Reusing existing EAS cert. Serial: ${easDistCert.serialNumber}, ID: ${easDistCert.id}`);
  } else {
    // Try to create a new one
    let appleDistCert;
    try {
      appleDistCert = await createDistributionCertificateAsync(authCtx);
      console.log(`   Created Apple cert. Serial: ${appleDistCert.distCertSerialNumber}`);
    } catch (err) {
      if (!err.message?.includes('Maximum number of certificates')) throw err;
      // Apple limit hit — list existing Apple certs
      const appleCerts = await listDistributionCertificatesAsync(authCtx);
      console.log(`   Apple cert limit hit. Existing Apple certs: ${appleCerts.map(c => `${c.id} (serial: ${c.serialNumber})`).join(', ')}`);
      throw new Error(
        'Apple Developer Portal has hit its distribution certificate limit.\n' +
        'Please revoke one at https://developer.apple.com/account/resources/certificates/list\n' +
        'and run this script again.'
      );
    }
    // Upload to EAS
    console.log('   Uploading cert to EAS...');
    easDistCert = await GQL.createDistributionCertificateAsync(gql, account, appleDistCert);
    console.log(`   Uploaded. EAS ID: ${easDistCert.id}`);
  }

  // 4. Apple Team + App Identifier on EAS
  console.log('4. Resolving Apple Team and App Identifier on EAS...');
  const appleTeam = await GQL.createOrGetExistingAppleTeamAndUpdateNameIfChangedAsync(
    gql, ACCOUNT_ID,
    { appleTeamIdentifier: TEAM_ID, appleTeamName: authCtx.team.name ?? 'futureshockholdings' }
  );
  const appleAppId = await GQL.createOrGetExistingAppleAppIdentifierAsync(gql, appLookupParams, appleTeam);
  console.log(`   Team EAS ID: ${appleTeam.id}, App Identifier EAS ID: ${appleAppId.id}`);

  // 5. Register Bundle ID in Apple Developer Portal
  console.log('5. Registering Bundle ID in Apple Developer Portal...');
  await ensureBundleIdExistsWithNameAsync(authCtx, {
    name: `@${ACCOUNT_NAME}/${PROJECT_NAME}`,
    bundleIdentifier: BUNDLE_ID,
  });
  console.log(`   ${BUNDLE_ID} registered.`);

  // 6. Check for existing provisioning profile on EAS — skip if already present
  console.log('6. Checking for existing Provisioning Profile on EAS...');
  let easProvProfile = await GQL.getProvisioningProfileAsync(gql, appLookupParams, IosDistributionType.AppStore);
  if (easProvProfile) {
    console.log(`   Provisioning profile already exists on EAS. ID: ${easProvProfile.id}`);
  } else {
    // Build the distCert shape needed by createProvisioningProfileAsync
    const distCertForProfile = {
      certId:               easDistCert.developerPortalIdentifier,
      certP12:              easDistCert.certificateP12,
      certPassword:         easDistCert.certificatePassword,
      distCertSerialNumber: easDistCert.serialNumber,
      teamId:               TEAM_ID,
      teamName:             authCtx.team.name ?? 'futureshockholdings',
    };

    console.log('   Creating Provisioning Profile via Apple API...');
    const profileName = `mykliq-appstore-${Date.now()}`;
    const appleProfile = await createProvisioningProfileAsync(
      authCtx, BUNDLE_ID, distCertForProfile, profileName, ApplePlatform.IOS, ProfileClass.General
    );
    console.log(`   Created Apple profile: ${appleProfile.name}`);

    console.log('   Uploading Provisioning Profile to EAS...');
    easProvProfile = await GQL.createProvisioningProfileAsync(gql, appLookupParams, appleAppId, {
      appleProvisioningProfile:  appleProfile.provisioningProfile,
      developerPortalIdentifier: appleProfile.provisioningProfileId,
    });
    console.log(`   Uploaded. EAS ID: ${easProvProfile.id}`);
  }

  // 7. Link cert + profile as IosAppBuildCredentials
  console.log('7. Linking credentials as IosAppBuildCredentials...');
  await GQL.createOrUpdateIosAppBuildCredentialsAsync(gql, appLookupParams, {
    appleTeam,
    appleAppIdentifierId:           appleAppId.id,
    iosDistributionType:            IosDistributionType.AppStore,
    appleProvisioningProfileId:     easProvProfile.id,
    appleDistributionCertificateId: easDistCert.id,
  });
  console.log('   Done!');

  console.log('\n=== Credential setup complete! ===');
  console.log('Now run: eas build --platform ios --profile production --non-interactive');
}

main().catch(err => {
  console.error('\nFATAL:', err.message || err);
  if (err.graphQLErrors) console.error('GraphQL errors:', JSON.stringify(err.graphQLErrors, null, 2));
  process.exit(1);
});
