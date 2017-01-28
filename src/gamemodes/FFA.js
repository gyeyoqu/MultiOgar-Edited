var Mode = require('./Mode');

function FFA() {
    Mode.apply(this, Array.prototype.slice.call(arguments));

    this.ID = 0;
    this.name = "Free For All";
    this.specByLeaderboard = true;
}

module.exports = FFA;
FFA.prototype = new Mode();

// Gamemode-specific functions

FFA.prototype.onPlayerSpawn = function(gameServer, player) {
    player.setColor(gameServer.getRandomColor());
    // Spawn player
    gameServer.spawnPlayer(player, gameServer.randomPos());
};

FFA.prototype.updateLB = function(gameServer) {
    gameServer.leaderboardType = this.packetLB;
    var lb = [],
        i = 0,
        l = gameServer.clients.length,
        iPush, client, score;

    for (; i < l; i++) {
        client = gameServer.clients[i];
        if (client.isRemoved) continue;
        if (client.playerTracker.cells.length <= 0) continue;

        lb.push(client.playerTracker);
    }

    lb.sort(scoreSort);

    gameServer.leaderboard = lb;
    this.rankOne = lb[0];
    gameServer.leaderboardChanged = true;
};

function scoreSort(a, b) {
    try {
        return b._score - a._score;
    } catch (e) {
        return 0;
    }
}
