const cricService = require("../services/cricService");
const tables = require("../db/tables");
const utils = require("../shared/utils");

async function getDescription(req, res, next) {
  try {
    const desc = cricService.getTableDescription();
    res.json(desc);
  } catch (error) {
    console.log("Error while loading CSV data:", error);
    next(error);
  }
}

async function getTableData(req, res, next) {
  try {
    let { table } = req.params;
    let { metrics, dimensions, metricsAgg = "sum" } = req.query;

    if (!["deliveries", "matches"].includes(table)) {
      throw new Error("Table not found");
    }
    if (!["sum", "avg"].includes(metricsAgg)) {
      throw new Error("wrong metricsAgg operator");
    }

    metrics = metrics ? metrics.split(",") : [];
    dimensions = dimensions ? dimensions.split(",") : [];

    // Extract filters
    const filters = Object.keys(req.query)
      .filter((k) => k.startsWith("filter:"))
      .reduce((acc, k) => {
        acc[k.substring(7)] = [
          ...(Array.isArray(req.query[k]) ? req.query[k] : [req.query[k]]),
        ].map((x) => utils.parseValue(k.substring(7), x)); // Use map to parse the values

        return acc; // Make sure to return the accumulator
      }, {});

    const result = utils.aggregateData(
      table === "deliveries" ? tables.deliveriesTable : tables.matchesTable,
      dimensions,
      metrics,
      filters,
      metricsAgg,
    );

    if (result.length > 10000) {
      throw new Error("Too many rows to display");
    }
    res.json(result);
  } catch (error) {
    console.log("Error while loading table data:", error);
    next(error);
  }
}

async function getReports(req, res, next) {
  try {
    const { reportType = "venue-report" } = req.query;
    const result = cricService.getReports(reportType, req.query);
    res.json(result);
  } catch (error) {
    console.log("Error while loading reports:", error);
    next(error);
  }
}

module.exports = {
  getDescription,
  getTableData,
  getReports,
};
