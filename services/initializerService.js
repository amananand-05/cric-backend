const fs = require("fs");
const csvParser = require("csv-parser");

const tables = require("../db/tables");
const utils = require("../shared/utils");

async function loadTables() {
  try {
    const deliveriesPath = "db/deliveries.csv";
    const matchesPath = "db/matches.csv";

    if (fs.existsSync(deliveriesPath) && fs.existsSync(matchesPath)) {
      console.log("📂 CSV files found. Loading data...");
      await loadCsvData(deliveriesPath, matchesPath);
    } else {
      console.log(
        "⚠️ CSV files not found. Please provide them in the db folder.",
      );
    }
  } catch (error) {
    console.error("Error while loading database data:", error);
  }
}

async function loadCsvData(deliveriesPath, matchesPath) {
  let deliveries = [];
  let matches = [];
  let type1 = [];
  let type2 = [];
  let ignoredRows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(deliveriesPath)
      .pipe(csvParser({ skipEmptyLines: true, maxRowBytes: 10 * 1024 })) // 10KB row limit
      .on("data", (row) =>
        deliveries.push(utils.parseRow(row, type1, ignoredRows)),
      )
      .on("end", () => resolve(deliveries))
      .on("error", (err) =>
        reject({ status: 500, message: "Failed to parse CSV file" }),
      );
  });
  await new Promise((resolve, reject) => {
    fs.createReadStream(matchesPath)
      .pipe(csvParser({ skipEmptyLines: true, maxRowBytes: 10 * 1024 })) // 10KB row limit
      .on("data", (row) =>
        matches.push(utils.parseRow(row, type2, ignoredRows)),
      )
      .on("end", () => resolve(matches))
      .on("error", (err) =>
        reject({ status: 500, message: "Failed to parse CSV file" }),
      );
  });

  tables.deliveriesTable = deliveries.filter((x) => Object.keys(x).length > 0);
  tables.matchesTable = matches.filter((x) => Object.keys(x).length > 0);
  tables.ignoredRows = ignoredRows; // not in use
  console.log("✅  Db tables loaded successfully.");
}

module.exports = { loadTables };
