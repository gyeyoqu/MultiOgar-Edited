var FFA = require('./FFA'),
    PlayerTracker = require('../PlayerTracker'),
    Packet = require('../packet'),
    BinaryWriter = Packet.BinaryWriter;

function RushMode() {
    FFA.apply(this, Array.prototype.slice.call(arguments));

    this.ID = 4;
    this.name = "Rush Mode";
    this.specByLeaderboard = true;

    this.stage = -1; // 0 - Waiting for players, 1 - Ingame, 2 - Stopped
    this.stageEndTime = null;

    // Config, values are in seconds
    this.waitStageTimes = [
        15,         // Stage 0
        60 * 5,     // Stage 1
        30          // Stage 2
    ];

    this._lb = [];
}

module.exports = RushMode;
RushMode.prototype = new FFA();

RushMode.prototype.onServerInit = function(gameServer) {
    this.onStageChange(gameServer);
};

RushMode.prototype.onCellAdd = function(cell) {
    if (cell.cellType === 2) cell.setColor({ r: 0xFC, g: 0x43, b: 0x49 });
};

RushMode.prototype.onTick = function(gameServer) {
    if (gameServer.stepDateTime >= this.stageEndTime)
        this.onStageChange(gameServer);
};

RushMode.prototype.onStageChange = function(gameServer) {
    this.stage++;
    if (this.stage > 2) this.stage = 0;
    this.stageEndTime = gameServer.stepDateTime + this.waitStageTimes[this.stage] * 1000;

    switch (this.stage) {
        case 0:
            this.resetWorld(gameServer);

            gameServer.run = true;
            break;
        case 1:
            this.resetWorld(gameServer);
            this.addBots(gameServer);

            gameServer.run = true;
            break;
        case 2:
            gameServer.run = false;
            this.winner = gameServer.largestClient;
            this.setToSpectate(gameServer);
            break;
    }
};

RushMode.prototype.addBots = function(gameServer) {
    var toAddBots = gameServer.config.serverBots - gameServer.socketCount;
    while (toAddBots-- > 0) gameServer.bots.addBot();
};

RushMode.prototype.setToSpectate = function(gameServer) {
    var i = 0, len = gameServer.clients.length, client;
    for (; i < len; i++) {
        client = gameServer.clients[i];
        if (client.isBot) continue;

        // Trick the client the player has no cells
        client.sendPacket(new Packet.ClearOwned());
        client.playerTracker.spectate = true;
        if (client.playerTracker === this.winner)
            client.playerTracker.freeRoam = true;
    }
};

RushMode.prototype.resetWorld = function(gameServer) {
    // Reset world - remove all bots and nodes
    while (gameServer.nodes.length) gameServer.removeNode(gameServer.nodes.shift());

    var i = 0, l = gameServer.clients.length;
    for (; i < l; ) {
        if (gameServer.clients[i].isConnected == null) {
            gameServer.clients[i].isConnected = false;
            gameServer.clients[i].close();
            l--;
        } else
            i++;
    }
}

RushMode.prototype.updateLB = function(gameServer) {
    gameServer.leaderboardType = 0x30;

    switch (this.stage) {
        case 0:
            this.updateLB0(gameServer);
            break;
        case 1:
            this.updateLB1(gameServer);
            break;
        case 2:
            this.updateLB2(gameServer);
            break;
    }
};

RushMode.prototype.getRemainingTimeString = function(gameServer) {
    var timeRemain = this.stageEndTime - gameServer.stepDateTime,
        minutesRemain = ~~(timeRemain / 60000),
        secondsRemain = ~~(timeRemain / 1000) - minutesRemain * 60;

    secondsRemain = secondsRemain.toString();
    if (secondsRemain.length === 1) secondsRemain = "0" + secondsRemain;
    return minutesRemain + ":" + secondsRemain;
};

RushMode.prototype.updateLB0 = function(gameServer) {
    var lb = [
        this.getRemainingTimeString(gameServer) + " until start",
        "Players: " + gameServer.socketCount
    ];

    this.rankOne = null;
    gameServer.leaderboard = lb;
    gameServer.leaderboardChanged = this._lb[0] !== lb[0];
    this.playerLeaderboard = [];
    this._lb = lb;
};

RushMode.prototype.updateLB1 = function(gameServer) {
    var lb = [], lbPlayers = [], client,
        i = 0, l = gameServer.clients.length,
        pushi = 0, rl = 0;

    for (; i < l; i++) {
        client = gameServer.clients[i];
        if (client.isRemoved) continue;
        client = client.playerTracker;
        if (!client.cells.length) continue;

        for (pushi = 0; pushi < rl; pushi++)
            if (client._score > lbPlayers[pushi]._score) break;

        lb.splice(pushi, 0, client._name);
        lbPlayers.splice(pushi, 0, client);
        rl++;
    }
    lb = lb.slice(0, gameServer.config.serverMaxLB);
    lb.push("Time left: " + this.getRemainingTimeString(gameServer));

    this.rankOne = lbPlayers[0];
    this.playerLeaderboard = lbPlayers;
    gameServer.leaderboard = lb;
    gameServer.leaderboardChanged = true;
};

RushMode.prototype.updateLB2 = function(gameServer) {
    var lb = [
        this.winner._name,
        "is the winner!",
        "Restarting in " + this.getRemainingTimeString(gameServer)
    ];

    this.rankOne = this.winner;
    gameServer.leaderboard = lb;
    gameServer.leaderboardChanged = this._lb[2] !== lb[2];
    this._lb = lb;
};
