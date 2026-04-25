"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUpcomingFixtures = fetchUpcomingFixtures;
exports.fetchFixture = fetchFixture;
exports.fetchFixturesByLeague = fetchFixturesByLeague;
exports.fetchFixtureStatistics = fetchFixtureStatistics;
exports.fetchFixtureEvents = fetchFixtureEvents;
exports.fetchFixtureLineups = fetchFixtureLineups;
exports.fetchLeagues = fetchLeagues;
exports.fetchLeagueStandings = fetchLeagueStandings;
exports.fetchTeams = fetchTeams;
exports.fetchTeam = fetchTeam;
exports.fetchTeamSquad = fetchTeamSquad;
exports.getApiStatus = getApiStatus;
var API_KEY = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
var BASE_URL = 'https://v3.football.api-sports.io';
// Fetch with proper headers for API-SPORTS
function apiRequest(endpoint) {
    return __awaiter(this, void 0, void 0, function () {
        var headers, response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    headers = {
                        'x-apisports-key': API_KEY || '',
                    };
                    return [4 /*yield*/, fetch("".concat(BASE_URL).concat(endpoint), {
                            method: 'GET',
                            headers: headers,
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("API-SPORTS error: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data];
            }
        });
    });
}
function fetchUpcomingFixtures() {
    return __awaiter(this, arguments, void 0, function (days) {
        var from, to, fromStr, toStr, data, error_1;
        if (days === void 0) { days = 7; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    from = new Date();
                    to = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
                    fromStr = from.toISOString().split('T')[0];
                    toStr = to.toISOString().split('T')[0];
                    return [4 /*yield*/, apiRequest("/fixtures?from=".concat(fromStr, "&to=").concat(toStr, "&status=NS,PM"))];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error fetching upcoming fixtures:', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchFixture(fixtureId) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiRequest("/fixtures?id=".concat(fixtureId))];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response[0]];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error fetching fixture:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchFixturesByLeague(leagueId, season, status) {
    return __awaiter(this, void 0, void 0, function () {
        var url, data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    url = "/fixtures?league=".concat(leagueId, "&season=").concat(season);
                    if (status) {
                        url += "&status=".concat(status);
                    }
                    return [4 /*yield*/, apiRequest(url)];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response];
                case 2:
                    error_3 = _a.sent();
                    console.error('Error fetching fixtures by league:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchFixtureStatistics(fixtureId) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiRequest("/fixtures/statistics?fixture=".concat(fixtureId))];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response];
                case 2:
                    error_4 = _a.sent();
                    console.error('Error fetching fixture statistics:', error_4);
                    throw error_4;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchFixtureEvents(fixtureId) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiRequest("/fixtures/events?fixture=".concat(fixtureId))];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response];
                case 2:
                    error_5 = _a.sent();
                    console.error('Error fetching fixture events:', error_5);
                    throw error_5;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchFixtureLineups(fixtureId) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiRequest("/fixtures/lineups?fixture=".concat(fixtureId))];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response];
                case 2:
                    error_6 = _a.sent();
                    console.error('Error fetching fixture lineups:', error_6);
                    throw error_6;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchLeagues() {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiRequest('/leagues')];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response];
                case 2:
                    error_7 = _a.sent();
                    console.error('Error fetching leagues:', error_7);
                    throw error_7;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchLeagueStandings(leagueId, season) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiRequest("/standings?league=".concat(leagueId, "&season=").concat(season))];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response];
                case 2:
                    error_8 = _a.sent();
                    console.error('Error fetching standings:', error_8);
                    throw error_8;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchTeams(leagueId, season) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiRequest("/teams?league=".concat(leagueId, "&season=").concat(season))];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response];
                case 2:
                    error_9 = _a.sent();
                    console.error('Error fetching teams:', error_9);
                    throw error_9;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchTeam(teamId) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiRequest("/teams?id=".concat(teamId))];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response[0]];
                case 2:
                    error_10 = _a.sent();
                    console.error('Error fetching team:', error_10);
                    throw error_10;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchTeamSquad(teamId, season) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiRequest("/players/squads?team=".concat(teamId, "&season=").concat(season))];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response[0]];
                case 2:
                    error_11 = _a.sent();
                    console.error('Error fetching team squad:', error_11);
                    throw error_11;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getApiStatus() {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, apiRequest('/status')];
                case 1:
                    data = _a.sent();
                    return [2 /*return*/, data.response];
                case 2:
                    error_12 = _a.sent();
                    console.error('Error fetching API status:', error_12);
                    throw error_12;
                case 3: return [2 /*return*/];
            }
        });
    });
}
