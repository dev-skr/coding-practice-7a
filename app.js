const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
let dbPath = path.join(__dirname + "/cricketMatchDetails.db");
let app = express();
app.use(express.json());
module.exports = app;
let db = null;

async function starting() {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => console.log("server started at 3000"));
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
}
starting();

app.get("/players/", async (request, response) => {
  let query = `select * from player_details`;
  let temp = await db.all(query);
  let result = temp.map((obj) => {
    return {
      playerId: obj.player_id,
      playerName: obj.player_name,
    };
  });
  response.send(result);
});

app.get("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let query = `select * from player_details where player_id=${playerId}`;
  let obj = await db.get(query);
  let result = {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
  response.send(result);
});

app.put("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let { playerName } = request.body;
  let query = `update player_details set 
    player_name="${playerName}"
    where player_id=${playerId}`;
  await db.run(query);
  response.send("Player Details Updated");
});

app.get("/players/:playerId/matches", async (request, response) => {
  let { playerId } = request.params;
  let query = `select match_details.match_id,
    match_details.match,match_details.year
     from player_match_score natural join match_details 
     where player_match_score.player_id=${playerId}`;
  let temp = await db.all(query);
  let result = temp.map((obj) => {
    return {
      matchId: obj.match_id,
      match: obj.match,
      year: obj.year,
    };
  });
  response.send(result);
});

app.get("/matches/:matchId/", async (request, response) => {
  let { matchId } = request.params;
  let query = `select * from match_details where match_id=${matchId}`;
  let temp = await db.get(query);
  let result = {
    matchId: temp.match_id,
    match: temp.match,
    year: temp.year,
  };
  response.send(result);
});

app.get("/matches/:matchId/players", async (request, response) => {
  let { matchId } = request.params;
  let query = `select player_details.player_id,player_details.player_name
    from (player_match_score inner join match_details
     on player_match_score.match_id=match_details.match_id) as t 
     inner join player_details on t.player_id=player_details.player_id
     where t.match_id=${matchId}`;
  let temp = await db.all(query);
  let result = temp.map((obj) => {
    return {
      playerId: obj.player_id,
      playerName: obj.player_name,
    };
  });
  response.send(result);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  let { playerId } = request.params;
  let query = `select player_details.player_id as playerId,
    player_details.player_name as playerName, 
    sum(player_match_score.score) as totalScore,
    sum( player_match_score.fours)as totalFours,
    sum( player_match_score.sixes)as totalSixes from 
     player_match_score natural join player_details 
     where  player_details.player_id=${playerId} 
     group by player_details.player_id`;
  let result = await db.get(query);
  response.send(result);
});
