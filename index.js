const express = require("express");
const fs = require("fs");
const axios = require("axios");
const csvParser = require("csv-parser");
const _ = require("lodash");
const bodyParser = require("body-parser");


const app = express();
const cricketsRouter = express.Router();
const PORT = 8080;

let deliveriesTable = [];
let matchesTable = [];

app.use(bodyParser.json({limit: "300mb"}));
app.use(cricketsRouter);
app.use(errorHandler);

app.listen(PORT, async () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    await loadTables();
});

// Routes
cricketsRouter.get("/cric/desc", async (req, res, next) => {
    try {
        const desc = {
            description: {
                tables: {
                    deliveries: {
                        headers: Object.keys(deliveriesTable[0]).reduce((acc, header) => {
                            acc[header] = typeof deliveriesTable[0][header];
                            return acc;
                        }, {})
                    }, matches: {
                        headers: Object.keys(matchesTable[0]).reduce((acc, header) => {
                            acc[header] = typeof matchesTable[0][header];
                            return acc;
                        }, {})
                    }
                }
            }
        }
        res.json(desc);
    } catch (error) {
        console.log("Error while loading CSV data:", error);
        next(error);
        // next({status: XXX, message: "xxxxx xxx xxx"});
    }
});

cricketsRouter.get("/cric/:table", async (req, res, next) => {
    try {
        // maximum 10000 rows should be allowed in any response
        let {table} = req.params;
        if (!["deliveries", "matches"].includes(table))
            throw new Error("Table not found");
        const tableData = table === "deliveries" ? deliveriesTable : matchesTable


        let {metrics, dimensions} = req.query;
        metrics = metrics ? metrics.split(",") : [];
        dimensions = dimensions ? dimensions.split(",") : [];
        let filters = Object.keys(req.query)
            .filter((k) => k.startsWith("filter:"))
            .reduce((acc, k) => {
                acc[k.substring(7)] = [
                    ...(Array.isArray(req.query[k]) ? req.query[k] : [req.query[k]])
                ].map(x => parseValue(k.substring(7), x)); // Use map to parse the values

                return acc; // Make sure to return the accumulator
            }, {});

        const result = aggregateData(tableData, dimensions, metrics, filters);
        if(result.length > 10000) {
            throw new Error("Too many rows to display");
        }
        res.json(result);
    } catch (error) {
        console.log("Error while loading CSV data:", error);
        next(error);
    }
});

// Helper functions
async function loadTables() {
    try {
        const deliveriesPath = "db/deliveries.csv";
        const matchesPath = "db/matches.csv";
        if (fs.existsSync(deliveriesPath) && fs.existsSync(matchesPath)) {
            console.log("CSV file exists. Loading data...");
            await loadCsvData(deliveriesPath, matchesPath);
        } else {
            console.log("CSV file not found. Downloading...");
            await loadCsvData();
        }
    } catch (error) {
        console.log("Error while loading db data:", error);
    }
}

async function loadCsvData(deliveriesPath, matchesPath) {
    let ignoredEntries = []
    await new Promise((resolve, reject) => {
        let t1 = []
        let t2 = []
        fs.createReadStream(deliveriesPath)
            .pipe(csvParser())
            .on("data", (row) => deliveriesTable.push(parseRow(row, t1, ignoredEntries)))
            .on("end", () => {
                console.log("CSV data loaded successfully.");
                resolve();
            })
            .on("error", (err) => reject({status: 500, message: "Failed to parse CSV file"}));

        fs.createReadStream(matchesPath)
            .pipe(csvParser())
            .on("data", (row) => matchesTable.push(parseRow(row, t2, ignoredEntries)))
            .on("end", () => {
                console.log("CSV data loaded successfully.");
                resolve();
            })
            .on("error", (err) => reject({status: 500, message: "Failed to parse CSV file"}));
    });
    deliveriesTable = deliveriesTable.filter(x => Object.keys(x).length > 0);
    matchesTable = matchesTable.filter(x => Object.keys(x).length > 0);
    // Note: ignoredEntries can contains row from both tables
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

function parseRow(row, type = [], ignored) {
    const parsedRow = {};
    if (["no result", "tie"].includes(row?.result)) {
        ignored.push(row);
        return {};
    }
    for (const key in row) {
        parsedRow[key] = parseValue(key, row[key]);

        // let value = row[key].trim();
        // if (["season"].includes(key)) parsedRow[key] = value;
        // // Convert to number if it's numeric
        // else if (!isNaN(Number(value)) && value !== "") parsedRow[key] = Number(value);
        // // Convert "true"/"false" to boolean
        // else if (value.toLowerCase() === "true") parsedRow[key] = true;
        // else if (value.toLowerCase() === "false") parsedRow[key] = false;
        // else parsedRow[key] = value; // Keep as string
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
        if (_.isEqual(type, temp))
            return parsedRow;
        throw new Error("Data type mismatch");
    }
}

async function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(err.status || 500).send({
        message: err.message || "Internal Server Error", stack: process.env.NODE_ENV === "production" ? "" : err.stack,
    });
}

function aggregateData(table, dimensions, metrics, filters) {
    try {
        // Step 1: Filter the data using Lodash
        let filteredData = table;

        if (filters) {
            filteredData = _.filter(filteredData, row => {
                return Object.keys(filters).every(key => {
                    const filterValues = filters[key];
                    return filterValues.includes(row[key]);
                });
            });
        }

        // Step 2: Group the data by dimensions using Lodash
        if (dimensions.length > 0) {
            const groupedData = _.groupBy(filteredData, row => {
                return dimensions.map(dim => row[dim]).join('-');  // Group by dimension values
            });

            // Step 3: Sum the metrics for each group using Lodash
            return _.map(groupedData, group => {
                const aggregatedRow = _.pick(group[0], dimensions);  // Keep dimension columns

                metrics.forEach(metric => {
                    aggregatedRow[metric] = _.sumBy(group, metric);  // Sum the metric values for the group
                });

                return aggregatedRow;
            });
        } else {
            // If no dimensions, just sum the metrics across all rows
            const aggregatedResult = {};

            metrics.forEach(metric => {
                aggregatedResult[metric] = _.sumBy(filteredData, metric);  // Sum all the metrics
            });

            return [aggregatedResult];  // Return as array to keep consistency
        }
    } catch (error) {
        console.error("Error during aggregation:", error);
        throw error;
    }
}
