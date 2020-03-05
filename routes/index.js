const express = require('express'),
    router = express.Router();
const _ = require('lodash'),
    io = require('../lib/io');
const fs = require('fs');
let increment = JSON.parse(fs.readFileSync('/Users/longpn1/workspaces/settings.json'));
let increment1 = JSON.parse(fs.readFileSync('/Users/longpn1/workspaces/settings1.json'));

const settingList = ["isWithoutReplacement", "numberOfDraws", "winnerCodeFontSize", "winnerNameFontSize"];

let settings = {
    isWithoutReplacement: true,
    numberOfDraws: 1,
    winnerCodeFontSize: 200,
    winnerNameFontSize: 15,
    spinDuration: 200,
    totalGold: 1,
    totalSilver: 5,
    totalBronze: 10,
    totalPlastic: 20
};

function deriveNumberOfDrawsAndEmit() {
    const newNDraws = 1;
    if (newNDraws !== settings.numberOfDraws) {
        settings.numberOfDraws = newNDraws;
        io.emitSettings(settings);
    }
}

var currentSpinCount = 0
let candidates = require('../conf').environment;

router.post("/addCandidate", function (req, res) {
    const val = req.param('candidate');
    if (val && val !== "") {
        candidates.push(val);
        boardcastCandidates();
        deriveNumberOfDrawsAndEmit();
    }
    res.end();
});

router.post('/removeCandidate', function (req, res) {
    const val = req.param('candidate');
    candidates = _.without(candidates, val);
    console.log("Candidate removed: " + poorMan);
    boardcastCandidates();
    deriveNumberOfDrawsAndEmit();
    res.end();
});

router.post('/clearCandidates', function (req, res) {
    candidates = [];
    boardcastCandidates();
    deriveNumberOfDrawsAndEmit();
    res.end();
});

router.post("/settings", (req, res) => {

    const settingsBody = req.body;
    settings = _.pick({...settings, ...settingsBody}, settingList);
    io.emitSettings(settings);
    res.end();
});

router.get('/rand', function (req, res) {
    const result = [];
    console.log(`raw data[${increment1[0]}]: ${increment[0]}`)
    for (let i = 0; i < settings.numberOfDraws; i++) {
        let randomNumber = _.random(candidates.length - 1)
        let poorMan = candidates[randomNumber]
        if (currentSpinCount + 1 == increment1[0]) {
            poorMan = increment[0]
            increment = _.without(increment, poorMan)
            increment1 = _.without(increment1, increment1[0])
        }
        result.push(poorMan);
        currentSpinCount ++;
        if (settings.isWithoutReplacement) {
            candidates = _.without(candidates, poorMan);
        }
        console.log(`spinCount: ${currentSpinCount}`)
        console.log(`poorMan: ${poorMan}`)
        console.log(`Candidates remaining: ${candidates.length}`)
    }

    io.emitRandResult(result);
    if (settings.isWithoutReplacement) {

        boardcastCandidates();
    }
    res.end();
});

router.get('/configs', (req, res) => {
    res.json({
        candidates,
        ...settings
    });
});

var boardcastCandidates = function () {
    io.emitCandidates(candidates);
};

module.exports = router;
