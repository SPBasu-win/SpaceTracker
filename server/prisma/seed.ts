import "dotenv/config";
import { AssetClass } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { upsertTlePayloads } from "../src/services/sync.service";

const issCatalogNumber = 25544;
const issLine1 = "1 25544U 98067A   24158.51782528  .00016717  00000+0  30363-3 0  9990";
const issLine2 = "2 25544  51.6388  15.5006 0006047  63.7621  64.8028 15.50103470456385";

async function main() {
  await prisma.orbitalAsset.upsert({
    where: { catalogNumber: issCatalogNumber },
    create: {
      catalogNumber: issCatalogNumber,
      internationalDesignator: "1998-067A",
      displayName: "ISS (ZARYA)",
      assetClass: AssetClass.CREWED,
      originCountry: "ISS",
      launchDate: new Date("1998-11-20"),
      orbitalEpoch: new Date("2024-06-06T12:25:40.104Z"),
    },
    update: {
      displayName: "ISS (ZARYA)",
      assetClass: AssetClass.CREWED,
      orbitalEpoch: new Date("2024-06-06T12:25:40.104Z"),
    },
  });

  await upsertTlePayloads([
    {
      catalogNumber: issCatalogNumber,
      name: "ISS (ZARYA)",
      line1: issLine1,
      line2: issLine2,
      epochTimestamp: new Date("2024-06-06T12:25:40.104Z"),
    },
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
