const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at http:localhost/3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBServer();

//Convert Player
const covertPlayer = (obj) => ({
  playerId: obj.player_id,
  playerName: obj.player_name,
});

//Convert Match
const convertMatch = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

//GET PlayerDetails API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `SELECT * FROM player_details;`;
  const dbResponse = await db.all(getPlayerQuery);
  response.send(dbResponse.map((each) => covertPlayer(each)));
});

//GET Player API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id=${playerId}`;
  const dbResponse = await db.get(getPlayerQuery);
  response.send(covertPlayer(dbResponse));
});

//PUT Player API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetail = request.body;
  const { playerName } = playerDetail;
  const putPlayerQuery = `UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId};`;
  await db.run(putPlayerQuery);
  response.send("Player Details Updated");
});

//GET MatchDetail API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const dbResponse = await db.get(getMatchDetailQuery);
  response.send(convertMatch(dbResponse));
});

//GET Player Match Details API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetailsQuery = `
        SELECT 
            match_details.match_id AS matchId,
            match,
            year
        FROM 
            player_match_score JOIN match_details ON player_match_score.match_id = match_details.match_id
        WHERE 
            player_id = ${playerId};`;
  const dbResponse = await db.all(getPlayerMatchDetailsQuery);
  response.send(dbResponse);
});

//GET API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchDetails = `
        SELECT 
            player_details.player_id AS playerId,
            player_name AS playerName
        FROM 
            player_details JOIN player_match_score ON player_details.player_id = player_match_score.player_id
        WHERE
            match_id = ${matchId};`;
  const dbResponse = await db.all(getPlayerMatchDetails);
  response.send(dbResponse);
});

//GET Player Stats API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getTotalQuery = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            sum(score) AS totalScore,
            sum(fours) As totalFours,
            sum(sixes) AS totalSixes
        FROM 
            player_details JOIN player_match_score ON player_details.player_id = player_match_score.player_id
        WHERE 
            player_match_score.player_id = ${playerId}`;
  const dbResponse = await db.get(getTotalQuery);
  response.send(dbResponse);
});

module.exports = app;
