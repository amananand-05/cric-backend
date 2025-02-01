const tables = require("../db/tables");
const reportService = require("./reportService");

function getTableDescription() {
  return {
    description: {
      tables: {
        deliveries: {
          headers: Object.keys(tables.deliveriesTable[0]).reduce(
            (acc, header) => {
              acc[header] = typeof tables.deliveriesTable[0][header];
              return acc;
            },
            {},
          ),
        },
        matches: {
          headers: Object.keys(tables.matchesTable[0]).reduce((acc, header) => {
            acc[header] = typeof tables.matchesTable[0][header];
            return acc;
          }, {}),
        },
      },
    },
  };
}

function getReports(reportType, reqQuery) {
  switch (reportType) {
    case "venue-report":
      return reportService.getVenueReport(reqQuery);
    case "dummy-report1":
      return {};
    case "dummy-report2":
      return {};
    default:
      return {};
  }
}

module.exports = { getTableDescription, getReports };
