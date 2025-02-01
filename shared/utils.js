const _ = require("lodash");

function aggregateData(
  tableData,
  dimensions,
  metrics,
  filters,
  metricsAgg = "sum",
) {
  // Step 1: Apply filters
  let filteredData = tableData;
  if (filters) {
    filteredData = _.filter(filteredData, (row) =>
      Object.keys(filters).every((key) => filters[key].includes(row[key])),
    );
  }

  // Step 2: Group data if dimensions exist
  if (dimensions.length > 0) {
    const groupedData = _.groupBy(filteredData, (row) =>
      dimensions.map((dim) => row[dim]).join("-"),
    );

    return _.map(groupedData, (group) => {
      const aggregatedRow = _.pick(group[0], dimensions);
      metrics.forEach((metric) => {
        aggregatedRow[metric] =
          metricsAgg === "sum"
            ? _.sumBy(group, metric)
            : _.meanBy(group, metric);
      });
      return aggregatedRow;
    });
  } else {
    // If no dimensions, sum metrics across all rows
    return [
      metrics.reduce((agg, metric) => {
        agg[metric] =
          metricsAgg === "sum"
            ? _.sumBy(filteredData, metric)
            : _.meanBy(filteredData, metric);
        return agg;
      }, {}),
    ];
  }
}

function parseRow(row, type = [], ignored) {
  try {
    const parsedRow = {};
    if (["no result", "tie"].includes(row?.result)) {
      ignored.push(row);
      return {};
    }
    for (const key in row) {
      parsedRow[key] = parseValue(key, row[key]);
    }

    if (type.length === 0) {
      Object.values(parsedRow).forEach((value) => {
        if (typeof value === "number") type.push("number");
        else if (typeof value === "boolean") type.push("boolean");
        else type.push("string");
      });
      return parsedRow;
    } else {
      let temp = [];
      Object.values(parsedRow).forEach((value) => {
        if (typeof value === "number") temp.push("number");
        else if (typeof value === "boolean") temp.push("boolean");
        else temp.push("string");
      });
      if (_.isEqual(type, temp)) return parsedRow;
      throw new Error("Data type mismatch");
    }
  } catch (error) {
    console.error(error);
    ignored.push(row);
  }
}

function parseValue(key, value) {
  value = value.trim();
  if (["season"].includes(key)) return value;
  // Convert to number if it's numeric
  if (!isNaN(Number(value)) && value !== "") return Number(value);
  // Convert "true"/"false" to boolean
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return value; // Keep as string
}

module.exports = {
  aggregateData,
  parseRow,
  parseValue,
};
