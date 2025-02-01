### data source

- https://www.kaggle.com/datasets/patrickb1912/ipl-complete-dataset-20082020?resource=download

`Note: servers holds deliveries.csv, matches.csv in-memory`

# run instructions
1. `cd cric-backend/`

2. `npm install`

3. `npm start`

4. `npm run format` - to format code

# Endpoints:

## 1. [GET] http://localhost:8080/cric/desc

sample response:

```json
{
  "description": {
    "tables": {
      "deliveries": {
        "headers": {
          "match_id": "number",
          "inning": "number",
          "batting_team": "string",
          "bowling_team": "string",
          "over": "number",
          "ball": "number",
          "batter": "string",
          "bowler": "string",
          "non_striker": "string",
          "batsman_runs": "number",
          "extra_runs": "number",
          "total_runs": "number",
          "extras_type": "string",
          "is_wicket": "number",
          "player_dismissed": "string",
          "dismissal_kind": "string",
          "fielder": "string"
        }
      },
      "matches": {
        "headers": {
          "id": "number",
          "season": "string",
          "city": "string",
          "date": "string",
          "match_type": "string",
          "player_of_match": "string",
          "venue": "string",
          "team1": "string",
          "team2": "string",
          "toss_winner": "string",
          "toss_decision": "string",
          "winner": "string",
          "result": "string",
          "result_margin": "number",
          "target_runs": "number",
          "target_overs": "number",
          "super_over": "string",
          "method": "string",
          "umpire1": "string",
          "umpire2": "string"
        }
      }
    }
  }
}
```

sample curl:

```text
curl --location 'http://localhost:8080/cric/desc'
```

## 2. [GET] http://localhost:8080/cric/:table

- path variable:
    - `table` - can be `matches` or `deliveries`
- query params:
    - `metrics` - comma separated list of columns to be aggregated
    - `dimensions` - comma separated list of columns to be grouped by
    - `filters` - like `filter:match_id=335982&filter:match_id=335984&filter:bowling_team=Kolkata Knight Riders`
      Will be interpreted as interpreted as
      ```json
      {
        "match_id": ["335982", "335984"],
        "bowling_team": ["Kolkata Knight Riders"]
      }
      ```
    - metricsAgg - can be `sum`, `avg`

sample response:

```json
[
  {
    "batting_team": "Royal Challengers Bangalore",
    "bowling_team": "Kolkata Knight Riders",
    "total_runs": 82
  }
]
```

sample curl:

```text
curl --location 'http://localhost:8080/cric/deliveries?metrics=total_runs&dimensions=batting_team%2Cbowling_team&filter%3Amatch_id=335982&filter%3Amatch_id=335984&filter%3Abowling_team=Kolkata%20Knight%20Riders&metricsAgg=sum'
```
  



