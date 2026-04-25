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
var supabase_js_1 = require("@supabase/supabase-js");
var api_football_1 = require("../lib/api-football");
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var apiKey = process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
function delay(ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        });
    });
}
function syncLeagues() {
    return __awaiter(this, void 0, void 0, function () {
        var leagues, leagueRecords, leagueError, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    console.log('[SYNC] Fetching leagues from API-SPORTS...');
                    return [4 /*yield*/, (0, api_football_1.fetchLeagues)()];
                case 1:
                    leagues = _a.sent();
                    console.log("[SYNC] Found ".concat(leagues.length, " leagues, inserting into database..."));
                    leagueRecords = leagues.map(function (l) {
                        var _a, _b;
                        return ({
                            id: l.league.id,
                            name: l.league.name,
                            country: ((_a = l.country) === null || _a === void 0 ? void 0 : _a.name) || l.league.country,
                            flag: (_b = l.country) === null || _b === void 0 ? void 0 : _b.flag,
                            logo: l.league.logo,
                            type: l.league.type,
                        });
                    });
                    return [4 /*yield*/, supabase
                            .from('leagues')
                            .upsert(leagueRecords, { onConflict: 'id' })];
                case 2:
                    leagueError = (_a.sent()).error;
                    if (leagueError)
                        throw leagueError;
                    // Update sync status
                    return [4 /*yield*/, supabase
                            .from('sync_status')
                            .upsert({
                            endpoint: 'leagues',
                            last_sync: new Date(),
                            last_sync_date: new Date().toISOString().split('T')[0],
                            status: 'success',
                            total_records: leagues.length,
                        }, { onConflict: 'endpoint' })];
                case 3:
                    // Update sync status
                    _a.sent();
                    return [2 /*return*/, {
                            endpoint: 'leagues',
                            recordsSync: leagues.length,
                            status: 'success',
                            timestamp: new Date().toISOString(),
                        }];
                case 4:
                    error_1 = _a.sent();
                    console.error('[ERROR] Failed to sync leagues:', error_1);
                    return [2 /*return*/, {
                            endpoint: 'leagues',
                            recordsSync: 0,
                            status: 'error',
                            timestamp: new Date().toISOString(),
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function syncFixtures() {
    return __awaiter(this, void 0, void 0, function () {
        var fixtures, fixtureRecords, fixtureError, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    console.log('[SYNC] Fetching upcoming fixtures from API-SPORTS...');
                    return [4 /*yield*/, (0, api_football_1.fetchUpcomingFixtures)(30)];
                case 1:
                    fixtures = _a.sent();
                    console.log("[SYNC] Found ".concat(fixtures.length, " fixtures, inserting into database..."));
                    fixtureRecords = fixtures.map(function (f) { return ({
                        id: f.fixture.id,
                        league_id: f.league.id,
                        season: f.league.season,
                        fixture_date: f.fixture.date,
                        round: f.league.round,
                        status: f.fixture.status.long,
                        status_short: f.fixture.status.short,
                        status_elapsed: f.fixture.status.elapsed,
                        home_team_id: f.teams.home.id,
                        away_team_id: f.teams.away.id,
                        home_goals: f.goals.home,
                        away_goals: f.goals.away,
                        home_goals_halftime: f.score.halftime.home,
                        away_goals_halftime: f.score.halftime.away,
                        home_goals_extra: f.score.extratime.home,
                        away_goals_extra: f.score.extratime.away,
                        home_goals_penalty: f.score.penalty.home,
                        away_goals_penalty: f.score.penalty.away,
                        venue_id: f.fixture.venue.id,
                        venue_name: f.fixture.venue.name,
                        venue_city: f.fixture.venue.city,
                        referee: f.fixture.referee,
                        extra_time: f.fixture.status.extra,
                    }); });
                    return [4 /*yield*/, supabase
                            .from('fixtures')
                            .upsert(fixtureRecords, { onConflict: 'id' })];
                case 2:
                    fixtureError = (_a.sent()).error;
                    if (fixtureError)
                        throw fixtureError;
                    // Update sync status
                    return [4 /*yield*/, supabase
                            .from('sync_status')
                            .upsert({
                            endpoint: 'fixtures',
                            last_sync: new Date(),
                            last_sync_date: new Date().toISOString().split('T')[0],
                            status: 'success',
                            total_records: fixtures.length,
                        }, { onConflict: 'endpoint' })];
                case 3:
                    // Update sync status
                    _a.sent();
                    return [2 /*return*/, {
                            endpoint: 'fixtures',
                            recordsSync: fixtures.length,
                            status: 'success',
                            timestamp: new Date().toISOString(),
                        }];
                case 4:
                    error_2 = _a.sent();
                    console.error('[ERROR] Failed to sync fixtures:', error_2);
                    return [2 /*return*/, {
                            endpoint: 'fixtures',
                            recordsSync: 0,
                            status: 'error',
                            timestamp: new Date().toISOString(),
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function syncTeams() {
    return __awaiter(this, void 0, void 0, function () {
        var popularLeagueIds, allTeams, _i, popularLeagueIds_1, leagueId, teams, error_3, teamRecords, teamError, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, , 11]);
                    console.log('[SYNC] Fetching teams from API-SPORTS...');
                    popularLeagueIds = [39, 40, 78, 135, 61, 203] // EPL, Championship, Bundesliga, La Liga, Ligue 1, Serie A
                    ;
                    allTeams = [];
                    _i = 0, popularLeagueIds_1 = popularLeagueIds;
                    _a.label = 1;
                case 1:
                    if (!(_i < popularLeagueIds_1.length)) return [3 /*break*/, 7];
                    leagueId = popularLeagueIds_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    console.log("[SYNC] Fetching teams for league ".concat(leagueId, "..."));
                    return [4 /*yield*/, (0, api_football_1.fetchTeams)(leagueId, new Date().getFullYear())];
                case 3:
                    teams = _a.sent();
                    allTeams = allTeams.concat(teams);
                    return [4 /*yield*/, delay(100)]; // Small delay between requests
                case 4:
                    _a.sent(); // Small delay between requests
                    return [3 /*break*/, 6];
                case 5:
                    error_3 = _a.sent();
                    console.warn("[WARN] Failed to fetch teams for league ".concat(leagueId, ":"), error_3);
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7:
                    console.log("[SYNC] Found ".concat(allTeams.length, " teams, inserting into database..."));
                    teamRecords = allTeams.map(function (t) {
                        var _a, _b, _c, _d;
                        return ({
                            id: t.team.id,
                            name: t.team.name,
                            code: t.team.code,
                            country: t.team.country,
                            founded: t.team.founded,
                            national: t.team.national,
                            logo: t.team.logo,
                            venue_id: (_a = t.venue) === null || _a === void 0 ? void 0 : _a.id,
                            venue_name: (_b = t.venue) === null || _b === void 0 ? void 0 : _b.name,
                            venue_city: (_c = t.venue) === null || _c === void 0 ? void 0 : _c.city,
                            venue_capacity: (_d = t.venue) === null || _d === void 0 ? void 0 : _d.capacity,
                        });
                    });
                    return [4 /*yield*/, supabase
                            .from('teams')
                            .upsert(teamRecords, { onConflict: 'id' })];
                case 8:
                    teamError = (_a.sent()).error;
                    if (teamError)
                        throw teamError;
                    // Update sync status
                    return [4 /*yield*/, supabase
                            .from('sync_status')
                            .upsert({
                            endpoint: 'teams',
                            last_sync: new Date(),
                            last_sync_date: new Date().toISOString().split('T')[0],
                            status: 'success',
                            total_records: allTeams.length,
                        }, { onConflict: 'endpoint' })];
                case 9:
                    // Update sync status
                    _a.sent();
                    return [2 /*return*/, {
                            endpoint: 'teams',
                            recordsSync: allTeams.length,
                            status: 'success',
                            timestamp: new Date().toISOString(),
                        }];
                case 10:
                    error_4 = _a.sent();
                    console.error('[ERROR] Failed to sync teams:', error_4);
                    return [2 /*return*/, {
                            endpoint: 'teams',
                            recordsSync: 0,
                            status: 'error',
                            timestamp: new Date().toISOString(),
                        }];
                case 11: return [2 /*return*/];
            }
        });
    });
}
function syncStandings() {
    return __awaiter(this, void 0, void 0, function () {
        var popularLeagueIds, season, allStandings, _i, popularLeagueIds_2, leagueId, standings, leagueStandings, _a, leagueStandings_1, group, _b, group_1, standing, error_5, standingsError, error_6;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 11, , 12]);
                    console.log('[SYNC] Fetching standings from API-SPORTS...');
                    popularLeagueIds = [39, 40, 78, 135, 61, 203];
                    season = new Date().getFullYear();
                    allStandings = [];
                    _i = 0, popularLeagueIds_2 = popularLeagueIds;
                    _c.label = 1;
                case 1:
                    if (!(_i < popularLeagueIds_2.length)) return [3 /*break*/, 7];
                    leagueId = popularLeagueIds_2[_i];
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 5, , 6]);
                    console.log("[SYNC] Fetching standings for league ".concat(leagueId, "..."));
                    return [4 /*yield*/, (0, api_football_1.fetchLeagueStandings)(leagueId, season)
                        // Flatten standings from groups
                    ];
                case 3:
                    standings = _c.sent();
                    // Flatten standings from groups
                    if (standings && standings[0] && standings[0].league && standings[0].league.standings) {
                        leagueStandings = standings[0].league.standings;
                        for (_a = 0, leagueStandings_1 = leagueStandings; _a < leagueStandings_1.length; _a++) {
                            group = leagueStandings_1[_a];
                            for (_b = 0, group_1 = group; _b < group_1.length; _b++) {
                                standing = group_1[_b];
                                allStandings.push({
                                    league_id: leagueId,
                                    season: season,
                                    team_id: standing.team.id,
                                    rank: standing.rank,
                                    group_name: standing.group || null,
                                    played: standing.all.played,
                                    win: standing.all.win,
                                    draw: standing.all.draw,
                                    lose: standing.all.lose,
                                    goals_for: standing.all.goals.for,
                                    goals_against: standing.all.goals.against,
                                    goals_diff: standing.goalsDiff,
                                    points: standing.points,
                                });
                            }
                        }
                    }
                    return [4 /*yield*/, delay(100)];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_5 = _c.sent();
                    console.warn("[WARN] Failed to fetch standings for league ".concat(leagueId, ":"), error_5);
                    return [3 /*break*/, 6];
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7:
                    console.log("[SYNC] Found ".concat(allStandings.length, " standings, inserting into database..."));
                    if (!(allStandings.length > 0)) return [3 /*break*/, 9];
                    return [4 /*yield*/, supabase
                            .from('standings')
                            .upsert(allStandings, { onConflict: 'league_id,season,team_id' })];
                case 8:
                    standingsError = (_c.sent()).error;
                    if (standingsError)
                        throw standingsError;
                    _c.label = 9;
                case 9: 
                // Update sync status
                return [4 /*yield*/, supabase
                        .from('sync_status')
                        .upsert({
                        endpoint: 'standings',
                        last_sync: new Date(),
                        last_sync_date: new Date().toISOString().split('T')[0],
                        status: 'success',
                        total_records: allStandings.length,
                    }, { onConflict: 'endpoint' })];
                case 10:
                    // Update sync status
                    _c.sent();
                    return [2 /*return*/, {
                            endpoint: 'standings',
                            recordsSync: allStandings.length,
                            status: 'success',
                            timestamp: new Date().toISOString(),
                        }];
                case 11:
                    error_6 = _c.sent();
                    console.error('[ERROR] Failed to sync standings:', error_6);
                    return [2 /*return*/, {
                            endpoint: 'standings',
                            recordsSync: 0,
                            status: 'error',
                            timestamp: new Date().toISOString(),
                        }];
                case 12: return [2 /*return*/];
            }
        });
    });
}
function runSync() {
    return __awaiter(this, void 0, void 0, function () {
        var status_1, results, _a, _b, _c, _d, _e, _f, _g, _h, error_7;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    console.log('\n=================================');
                    console.log('   O2-5 API-SPORTS SYNC SCRIPT');
                    console.log('=================================\n');
                    _j.label = 1;
                case 1:
                    _j.trys.push([1, 10, , 11]);
                    // Check API status first
                    console.log('[INFO] Checking API-SPORTS status...');
                    return [4 /*yield*/, (0, api_football_1.getApiStatus)()];
                case 2:
                    status_1 = _j.sent();
                    console.log("[INFO] API Status: ".concat(JSON.stringify(status_1)));
                    console.log('');
                    results = [];
                    // Run syncs in sequence
                    _b = (_a = results).push;
                    return [4 /*yield*/, syncLeagues()];
                case 3:
                    // Run syncs in sequence
                    _b.apply(_a, [_j.sent()]);
                    return [4 /*yield*/, delay(500)];
                case 4:
                    _j.sent();
                    _d = (_c = results).push;
                    return [4 /*yield*/, syncTeams()];
                case 5:
                    _d.apply(_c, [_j.sent()]);
                    return [4 /*yield*/, delay(500)];
                case 6:
                    _j.sent();
                    _f = (_e = results).push;
                    return [4 /*yield*/, syncFixtures()];
                case 7:
                    _f.apply(_e, [_j.sent()]);
                    return [4 /*yield*/, delay(500)];
                case 8:
                    _j.sent();
                    _h = (_g = results).push;
                    return [4 /*yield*/, syncStandings()];
                case 9:
                    _h.apply(_g, [_j.sent()]);
                    console.log('\n=================================');
                    console.log('        SYNC SUMMARY');
                    console.log('=================================\n');
                    results.forEach(function (result) {
                        console.log("".concat(result.endpoint, ": ").concat(result.recordsSync, " records synced [").concat(result.status, "]"));
                    });
                    console.log('\n[SUCCESS] Sync completed successfully!');
                    return [3 /*break*/, 11];
                case 10:
                    error_7 = _j.sent();
                    console.error('[CRITICAL ERROR] Sync failed:', error_7);
                    process.exit(1);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Run the sync
runSync().catch(function (error) {
    console.error(error);
    process.exit(1);
});
