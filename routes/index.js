const express = require('express'),
    router = express.Router();
const _ = require('lodash'),
    io = require('../lib/io');

const settingList = ["isWithoutReplacement", "numberOfDraws", "winnerCodeFontSize", "winnerNameFontSize"];

let settings = {
    isWithoutReplacement: true,
    numberOfDraws: 1,
    winnerCodeFontSize: 200,
    winnerNameFontSize: 100,
    spinDuration: 200
};

function deriveNumberOfDrawsAndEmit() {
    const newNDraws = 1;
    if (newNDraws !== settings.numberOfDraws) {
        settings.numberOfDraws = newNDraws;
        io.emitSettings(settings);
    }
}

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
    for (let i = 0; i < settings.numberOfDraws; i++) {
        const randomNumber = _.random(candidates.length - 1),
            poorMan = candidates[randomNumber];
        result.push(poorMan);
        if (settings.isWithoutReplacement) {
            candidates = _.without(candidates, poorMan);
        }
        console.log("Candidates remaining: " + candidates.length);
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
