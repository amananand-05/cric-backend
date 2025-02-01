const tables = require("../db/tables");
const utils = require("../shared/utils");

function getVenueReport(reqQuery) {
  const { venue } = reqQuery;
  const venueMatches = tables.matchesTable.filter(
    (match) => match.venue === venue,
  );

  return {
    venue: venue,
    totalMatches: venueMatches.length,
    avgTarget: utils.aggregateData(
      venueMatches,
      [],
      ["target_runs"],
      {},
      "avg",
    )?.[0].target_runs,
  };
}

module.exports = { getVenueReport };
