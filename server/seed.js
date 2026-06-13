require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create orbital assets (satellites)
  const iss = await prisma.orbitalAsset.upsert({
    where: { catalogNumber: 25544 },
    update: {},
    create: {
      catalogNumber: 25544,
      internationalDesignator: '1998-067A',
      displayName: 'ISS (ZARYA)',
      assetClass: 'CREWED',
      operatorName: 'NASA/Roscosmos/ESA/JAXA/CSA',
      originCountry: 'International',
      launchDate: new Date('1998-11-20'),
      orbitalEpoch: new Date(),
    }
  });

  const hubble = await prisma.orbitalAsset.upsert({
    where: { catalogNumber: 20580 },
    update: {},
    create: {
      catalogNumber: 20580,
      internationalDesignator: '1990-037B',
      displayName: 'HST (Hubble Space Telescope)',
      assetClass: 'SCIENTIFIC',
      operatorName: 'NASA/ESA',
      originCountry: 'USA',
      launchDate: new Date('1990-04-24'),
      orbitalEpoch: new Date(),
    }
  });

  const starlink = await prisma.orbitalAsset.upsert({
    where: { catalogNumber: 44235 },
    update: {},
    create: {
      catalogNumber: 44235,
      internationalDesignator: '2019-029A',
      displayName: 'STARLINK-1',
      assetClass: 'COMMUNICATION',
      operatorName: 'SpaceX',
      originCountry: 'USA',
      launchDate: new Date('2019-05-24'),
      orbitalEpoch: new Date(),
    }
  });

  console.log('Created orbital assets:', { iss: iss.assetId, hubble: hubble.assetId, starlink: starlink.assetId });

  // Add TLE data for ISS
  await prisma.orbitalElementsArchive.create({
    data: {
      assetId: iss.assetId,
      elementLine1: '1 25544U 98067A   24164.51782528  .00016717  00000+0  10270-3 0  9992',
      elementLine2: '2 25544  51.6412  33.0404 0006741  60.5452  29.6235 15.4982 16434',
      epochTimestamp: new Date(),
    }
  });

  // Add TLE data for Hubble
  await prisma.orbitalElementsArchive.create({
    data: {
      assetId: hubble.assetId,
      elementLine1: '1 20580U 90037B   24164.51782528  .00016717  00000+0  10270-3 0  9992',
      elementLine2: '2 20580  28.4700  33.0404 0006741  60.5452  29.6235 15.0982 15434',
      epochTimestamp: new Date(),
    }
  });

  console.log('Created TLE data');

  const observer = await prisma.$queryRaw`
    INSERT INTO observer_profiles (contact_email, tracking_location, minimum_visibility_angle, preferred_asset_id)
    VALUES ('observer@example.com', ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326), 15.0, ${iss.assetId}::uuid)
    RETURNING observer_id
  `;
  const observerId = observer[0].observer_id;
  console.log('Created observer:', observerId);

  // Create a visibility window
  await prisma.visibilityWindow.create({
    data: {
      observerId: observerId,
      assetId: iss.assetId,
      acquisitionTime: new Date(Date.now() + 3600000),
      lossTime: new Date(Date.now() + 7200000),
      peakElevation: 45.5,
      approachSector: 'NW',
      illuminationState: 'SUNLIT',
      visibilityRating: 4,
    }
  });

  console.log('Created visibility window');

  // Create tracked asset
  await prisma.trackedAsset.create({
    data: {
      observerId: observerId,
      assetId: hubble.assetId,
    }
  });

  console.log('Created tracked asset');

  // Create observation log using raw SQL for PostGIS point
  await prisma.$executeRaw`
    INSERT INTO observation_logs (observer_id, asset_id, observation_location, observation_time, tracking_duration_seconds, signal_quality, remarks)
    VALUES (${observerId}::uuid, ${iss.assetId}::uuid, ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326), NOW(), 300, 8, 'Clear pass, visible to naked eye')
  `;

  console.log('Created observation log');

  console.log('Seeding complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });