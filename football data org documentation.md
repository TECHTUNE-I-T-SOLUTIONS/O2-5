my api key = 4d05a14d149b41dbb262e576091bd9d7



"Lookup Tables
Quick access to information that you’ll love. Because I know it’s super convenient to find all possible values for a given something of an external system, below you can find all enum types used in my backend and exposed via API. I also provide aggregated lists of stuff you likely already came across in other parts of the documentation.

Enum-Types
Because I know it’s super convenient to find all possible values for a given something of an external system, below you can find all enum types used in my backend and exposed via API.

Table 1. Enum-Types
Resource	Attribute	Possible values
Competition

type

LEAGUE | LEAGUE_CUP | CUP | PLAYOFFS

Team

type

MEN_CLUB | MEN_NATIONAL | WOMEN_CLUB | WOMEN_NATIONAL

Match

status

SCHEDULED | TIMED | IN_PLAY | PAUSED | EXTRA_TIME | PENALTY_SHOOTOUT | FINISHED | SUSPENDED | POSTPONED | CANCELLED | AWARDED

Match

stage

FINAL | THIRD_PLACE | SEMI_FINALS | QUARTER_FINALS | LAST_16 | LAST_32 | LAST_64 | ROUND_4 | ROUND_3 | ROUND_2 | ROUND_1 | GROUP_STAGE | PRELIMINARY_ROUND | QUALIFICATION | QUALIFICATION_ROUND_1 | QUALIFICATION_ROUND_2 | QUALIFICATION_ROUND_3 | PLAYOFF_ROUND_1 | PLAYOFF_ROUND_2 | PLAYOFFS | REGULAR_SEASON | CLAUSURA | APERTURA | CHAMPIONSHIP | RELEGATION | RELEGATION_ROUND

Match

group

GROUP_A | GROUP_B | GROUP_C | GROUP_D | GROUP_E | GROUP_F | GROUP_G | GROUP_H | GROUP_I | GROUP_J | GROUP_K | GROUP_L

Penalty

type

MATCH | SHOOTOUT

Score

duration

REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT

Card

type

YELLOW | YELLOW_RED | RED

Goal

type

REGULAR | OWN | PENALTY

Person with type REF

role

REFEREE | ASSISTANT_REFEREE_N1 | ASSISTANT_REFEREE_N2 | ASSISTANT_REFEREE_N3 | FOURTH_OFFICIAL | VIDEO_ASSISTANT_REFEREE_N1 | VIDEO_ASSISTANT_REFEREE_N2 | VIDEO_ASSISTANT_REFEREE_N3

Request Headers
Header-Name	Possible values	Description
X-Auth-Token

[a-z1-9]+

Your authentication token

X-Unfold-Lineups

[ true | false ]

Unfold lineups within the reponse or not

X-Unfold-Bookings

[ true | false ]

Unfold bookings within the reponse or not

X-Unfold-Subs

[ true | false ]

Unfold substitutions within the reponse or not

X-Unfold-Goals

[ true | false ]

Unfold goals within the reponse or not

Response Headers
Examine the underneath HTTP response headers to debug responses that do not look like you expected.

Header-Name	Example value	Description
X-API-Version

v4

indicates the version you are using

X-Authenticated-Client

Jimbo Jones

Shows the detected API-client or 'anonymous'

X-RequestCounter-Reset

23

Defines the seconds left to reset your request counter.

X-RequestsAvailable

21

Shows the remaining requests before being blocked.

Filters
Filter	Possible value(s)	Description
id

Integer /[0-9]+/

The (unique) id of a resource.

matchday

Integer /[1-4]*[0-9]*/

Drill down on a matchday; defaults to null

areas

comma separated string
/\d+,\d+/

Drill down on areas; defaults to null ⇒ all

season

String /\d\d\d\d/

Defaults to the starting year of the current season, given as 4 digit like '2022'

venue

HOME|AWAY

Define the venue of the matches to be returned.

competitions

comma separated string
/\d+,\d+/

A list of, comma separated competition-code(s) for drill down.

date

A date in format yyyy-MM-dd

Drill down on a given date

dateFrom

A date in format yyyy-MM-dd

Use in conjunction with dateTo

dateTo

A date in format yyyy-MM-dd

Drill down on a given date range

status

Enum, see above

Drill down on a (comma separated list of) status

lineup

STARTING | BENCH

Lets you define the starting type of a player

e

GOAL | ASSIST | SUB_IN | SUB_OUT

Lets you define an event

limit

Integer [1-500]

Limit the result set

offset

Integer [1-500]

Use an offset with a limit to traverse a huge list

League-Codes
I once added codes to all competitions so I did not need to remember the id any more. You’re welcome to make use of them as well, you can use them anywhere where you’d want to use the id.

Table 2. League-Codes used in the Competition resource
Competition Id	League-Code	Caption	Country/Continent
2006

QCAF

WC Qualification CAF

Africa

2024

ASL

Liga Profesional

Argentina

2147

QAFC

WC Qualification AFC

Asia

2008

AAL

A League

Australia

2022

APL

Playoffs 1/2

Austria

2012

ABL

Bundesliga

Austria

2032

BJPP

Playoffs

Belgium

2009

BJL

Jupiler Pro League

Belgium

2029

BSB

Campeonato Brasileiro Série B

Brazil

2013

BSA

Campeonato Brasileiro Série A

Brazil

2048

CPD

Primera División

Chile

2044

CSL

Chinese Super League

China PR

2045

CLP

Liga Postobón

Colombia

2047

PRVA

Prva Liga

Croatia

2141

DELP

Euro League - Playoff

Denmark

2050

DSU

Superliga

Denmark

2016

ELC

Championship

England

2021

PL

Premier League

England

2139

FLC

Football League Cup

England

2030

EL1

League One

England

2053

ENL

National League

England

2054

EL2

League Two

England

2055

FAC

FA Cup

England

2056

COM

FA Community Shield

England

2018

EC

European Championship

Europe

2146

EL

UEFA Europa League

Europe

2154

UCL

UEFA Conference League

Europe

2001

CL

UEFA Champions League

Europe

2157

ESC

Supercup

Europe

2007

QUFA

WC Qualification UEFA

Europe

2031

VEI

Veikkausliiga

Finland

2142

FL2

Ligue 2

France

2143

FPL

Playoffs 1/2

France

2015

FL1

Ligue 1

France

2129

REG

Regionalliga

Germany

2134

GSC

DFL Super Cup

Germany

2140

BL3

3. Bundesliga

Germany

2156

BLREL

Relegation

Germany

2002

BL1

Bundesliga

Germany

2004

BL2

2. Bundesliga

Germany

2011

DFB

DFB-Pokal

Germany

2132

GSL

Super League

Greece

2128

HNB

NB I

Hungary

2125

ILH

Ligat ha’Al

Israel

2019

SA

Serie A

Italy

2121

SB

Serie B

Italy

2122

CIT

Coppa Italia

Italy

2123

ISC

Serie C

Italy

2158

IPL

Playoffs 1/2

Italy

2119

JJL

J. League

Japan

2113

LMX

Liga MX

Mexico

2109

KNV

KNVB Beker

Netherlands

2003

DED

Eredivisie

Netherlands

2005

DJL

Eerste Divisie

Netherlands

2106

TIP

Tippeligaen

Norway

2103

QOFC

WC Qualification OFC

Oceania

2101

PPD

Primera División

Peru

2017

PPL

Primeira Liga

Portugal

2094

RL1

Liga I

Romania

2137

RFPL

RFPL

Russia

2084

SPL

Premier League

Scotland

2152

CLI

Copa Libertadores

South America

2080

CA

Copa America

South America

2082

QCBL

WC Qualification CONMEBOL

South America

2077

SD

Segunda División

Spain

2079

CDR

Copa del Rey

Spain

2014

PD

Primera Division

Spain

2073

ALL

Allsvenskan

Sweden

2072

SSL

Super League

Switzerland

2070

TSL

Süper Lig

Turkey

2064

UPL

Premier Liha

Ukraine

2145

MLS

MLS

United States

2148

SUCU

Supercopa Uruguaya

Uruguay

2153

OLY

Summer Olympics

World

2000

WC

FIFA World Cup

World

2155

QCCF

WC Qualification CONCACAF

World"





"Trend
Overview
The Trend Resource provides extensive derived form data. You can use trends to determine the current form / strength of a team for certain metrics.

You can make use of them either by looking at past data and see if the trend was confirmed by the result of the match or if it was an outlier.

The data of a trend basically comes either as Average, which takes the totals of a metric and divides by the no of matches, or it comes as Percentage, represented as a number between 0 and 1, indicating the % of matches a certain metric happened. The data points are prefixed accordingly, avg_ or pct_. All metrics are built over the values within the given input window of matches, the default window considers the last 5 matches.

So for instance, pct_2nd_hf_o_05 with a value of 0.8 means 80% of the matches taken into account at least one total goal in the second half was scored.

Only want to know in how many of the matches the team scored at home? Use the consider_side filter for that, so only home matches are taken into account for the home team and only away matches for the away team.

The following request returns all trends for matches played on St. Nicholas Day 2025.

curl -XGET 'https://api.football-data.org/v4/trends/?date=2025-12-06' -H "X-Auth-Token: UR_TOKEN"
Let’s see the entire beauty of the trend resource below.

{
  "meta": {
    "filters": {
      "consider_side": false,
      "window": 5,
      "competitions": "WC,BSA,CL,FL1,SA,PPL,PL,DED,EC,ELC,PD,BL1",
      "dateFrom": "2025-12-06",
      "dateTo": "2025-12-07"
    },
    "result_set": {
      "count": 41,
      "competitions": "PL,ELC,PD,SA,BL1,PPL,DED,FL1,BSA",
      "first": "2025-12-06",
      "last": "2025-12-07"
    }
  },
  "trends": [
    {
      "id": 537926,
      "status": "finished",
      "competition": {
        "id": 2021,
        "name": "Premier League",
        "area": {
          "code": "ENG",
          "name": "England",
          "ensignUrl": "https://crests.football-data.org/770.svg"
        }
      },
      "matchday": 15,
      "season": {
        "id": 2403,
        "startDate": "2025-08-15",
        "endDate": "2026-05-24",
        "currentMatchday": 21,
        "winner": null
      },
      "homeTeam": {
        "id": 58,
        "name": "Aston Villa FC"
      },
      "awayTeam": {
        "id": 57,
        "name": "Arsenal FC"
      },
      "trend": {
        "home": {
          "avg_goals": 3.6,
          "avg_goals_conceded": 1.0,
          "avg_goals_scored": 2.6,
          "avg_points": 3.0,
          "competitions": "PL,EL",
          "form": "WWWWW",
          "match_ids": [
            537916,
            537906,
            552192,
            537901,
            537886
          ],
          "pct_1st_hf_o_05": 0.6,
          "pct_1st_hf_o_15": 0.6,
          "pct_1st_hf_o_25": 0.0,
          "pct_1st_hf_u_05": 0.4,
          "pct_1st_hf_u_15": 0.4,
          "pct_1st_hf_u_25": 1.0,
          "pct_2nd_hf_o_05": 0.8,
          "pct_2nd_hf_o_15": 0.6,
          "pct_2nd_hf_o_25": 0.0,
          "pct_2nd_hf_u_05": 0.2,
          "pct_2nd_hf_u_15": 0.4,
          "pct_2nd_hf_u_25": 1.0,
          "pct_bts": 0.6,
          "pct_draws": 0.0,
          "pct_fts": 0.0,
          "pct_losses": 0.0,
          "pct_o_05": 1.0,
          "pct_o_15": 0.8,
          "pct_o_25": 0.8,
          "pct_o_35": 0.4,
          "pct_u_05": 0.0,
          "pct_u_15": 0.2,
          "pct_u_25": 0.2,
          "pct_u_35": 0.6,
          "pct_wins": 1.0,
          "team_id": 58,
          "window_end_date": "2025-12-03",
          "window_start_date": "2025-11-09"
        },
        "away": {
          "avg_goals": 3.4,
          "avg_goals_conceded": 1.0,
          "avg_goals_scored": 2.4,
          "avg_points": 2.2,
          "competitions": "PL,CL",
          "form": "WDWWD",
          "match_ids": [
            537917,
            537909,
            551911,
            537897,
            537885
          ],
          "pct_1st_hf_o_05": 0.6,
          "pct_1st_hf_o_15": 0.2,
          "pct_1st_hf_o_25": 0.0,
          "pct_1st_hf_u_05": 0.4,
          "pct_1st_hf_u_15": 0.8,
          "pct_1st_hf_u_25": 1.0,
          "pct_2nd_hf_o_05": 1.0,
          "pct_2nd_hf_o_15": 0.6,
          "pct_2nd_hf_o_25": 0.0,
          "pct_2nd_hf_u_05": 0.0,
          "pct_2nd_hf_u_15": 0.4,
          "pct_2nd_hf_u_25": 1.0,
          "pct_bts": 0.8,
          "pct_draws": 0.4,
          "pct_fts": 0.0,
          "pct_losses": 0.0,
          "pct_o_05": 1.0,
          "pct_o_15": 1.0,
          "pct_o_25": 0.6,
          "pct_o_35": 0.6,
          "pct_u_05": 0.0,
          "pct_u_15": 0.0,
          "pct_u_25": 0.4,
          "pct_u_35": 0.4,
          "pct_wins": 0.6,
          "team_id": 57,
          "window_end_date": "2025-12-03",
          "window_start_date": "2025-11-08"
        }
      },
      "odds": {
        "odds_1x2": {
          "home": 4.19,
          "draw": 3.45,
          "away": 1.9
        },
        "asian_handicap": {
          "-0.25": {
            "at": 1.29,
            "ht": 3.48
          },
          "-0.50": {
            "at": 1.24,
            "ht": 3.95
          },
          "-0.75": {
            "at": 1.14,
            "ht": 5.02
          },
          "-1.00": {
            "at": 1.05,
            "ht": 7.8
          },
          "-1.25": {
            "at": 1.04,
            "ht": 8.15
          },
          "-1.50": {
            "at": 1.04,
            "ht": 8.85
          },
          "-1.75": {
            "at": 1.03,
            "ht": 10.5
          },
          "0": {
            "at": 1.38,
            "ht": 2.95
          },
          "0.25": {
            "at": 1.64,
            "ht": 2.24
          },
          "0.50": {
            "at": 1.9,
            "ht": 1.91
          },
          "0.75": {
            "at": 2.17,
            "ht": 1.68
          },
          "1.00": {
            "at": 2.72,
            "ht": 1.46
          },
          "1.25": {
            "at": 3.09,
            "ht": 1.35
          },
          "1.50": {
            "at": 3.51,
            "ht": 1.29
          },
          "1.75": {
            "at": 4.26,
            "ht": 1.2
          },
          "2.00": {
            "at": 6.45,
            "ht": 1.1
          },
          "2.25": {
            "at": 6.57,
            "ht": 1.09
          },
          "2.50": {
            "at": 7.1,
            "ht": 1.07
          },
          "2.75": {
            "at": 9.5,
            "ht": 1.04
          },
          "3.00": {
            "at": 16.5,
            "ht": 1.01
          }
        },
        "btts": 1.88,
        "over_under": {
          "0.50": {
            "o": 1.05,
            "u": 8.68
          },
          "0.75": {
            "o": 1.05,
            "u": 7.63
          },
          "1.00": {
            "o": 1.08,
            "u": 6.95
          },
          "1.25": {
            "o": 1.2,
            "u": 4.3
          },
          "1.50": {
            "o": 1.33,
            "u": 3.2
          },
          "1.75": {
            "o": 1.4,
            "u": 2.84
          },
          "2.00": {
            "o": 1.54,
            "u": 2.45
          },
          "2.25": {
            "o": 1.81,
            "u": 2.01
          },
          "2.50": {
            "o": 2.05,
            "u": 1.76
          },
          "2.75": {
            "o": 2.34,
            "u": 1.58
          },
          "3.00": {
            "o": 2.87,
            "u": 1.4
          },
          "3.25": {
            "o": 3.2,
            "u": 1.33
          },
          "3.50": {
            "o": 3.59,
            "u": 1.27
          },
          "3.75": {
            "o": 4.27,
            "u": 1.18
          },
          "4.00": {
            "o": 5.84,
            "u": 1.1
          },
          "4.25": {
            "o": 6.18,
            "u": 1.09
          },
          "4.50": {
            "o": 7.09,
            "u": 1.08
          },
          "4.75": {
            "o": 8.0,
            "u": 1.06
          },
          "5.00": {
            "o": 13.0,
            "u": 1.03
          },
          "5.25": {
            "o": 12.0,
            "u": 1.02
          },
          "5.50": {
            "o": 14.63,
            "u": 1.02
          },
          "6.50": {
            "o": 28.25,
            "u": 1.01
          },
          "7.50": {
            "o": 67.0,
            "u": 1.0
          },
          "8.50": {
            "o": 67.0,
            "u": 1.0
          }
        }
      },
      "score": {
        "penalties": {
          "homeTeam": null,
          "awayTeam": null
        },
        "winner": "HOME_TEAM",
        "duration": "REGULAR",
        "fullTime": {
          "homeTeam": 2,
          "awayTeam": 1
        },
        "halfTime": {
          "homeTeam": 1,
          "awayTeam": 0
        },
        "extraTime": {
          "homeTeam": null,
          "awayTeam": null
        }
      },
      "utcDate": "2025-12-06T12:30:00Z",
      "lastUpdated": "2026-03-01T07:45:01"
    },
    { ... }
  ]
}
We can see in the metadata, that because we omitted the competition filter, we requested trend data for all competitions within our subscription, in this case the Free Tier. We can also see that dateFrom and dateTo were set according to our passed date query parameter and the default values for window and consider_side were applied. Last but not least, we can see there is data returned for 41 matches in total which consist of almost all competitions apart from World Cup and Champions League.

Available filters for the trend resource
You can control which matches to display trends for as well as what matches should be taken into account for the trend data.

Filter name	Possible values	Sample	Description
date

A date in format yyyy-MM-dd

/?date=2025-12-06

Filter returned matches for the given date, defaults to today. If present, has precedence over dateFrom/dateTo

dateFrom

A date in format yyyy-MM-dd

/?dateFrom=2025-12-01

Must be used in conjunction with dateTo

dateTo

A date in format yyyy-MM-dd

/?dateTo=2025-12-31

Filters all returned matches from dateFrom until dateTo, which is exclusive — e.g. to fetch all of a weekend, use dateFrom=2026-03-02&dateTo=2026-03-09.

competitions

A list of competition codes, comma separated

/?competitions=PL,DED

Filters returned matches to only include matches for the given competitions

window

Integer [1-15]

/?window=8

Calculates trends for the last 8 matches

consider_side

Feature flag, just include it as query param or not

/?consider_side

When enabled, only home matches are considered for the home team’s trend, and only away matches for the away team’s trend

Available data points
Data Point	Type	Description
avg_goals

float

Average total goals per match (scored + conceded)

avg_goals_conceded

float

Average goals conceded per match

avg_goals_scored

float

Average goals scored per match

avg_points

float

Average points earned per match (3=win, 1=draw, 0=loss)

competitions

string

Comma-separated codes of competitions represented in the window

form

string

Recent match results as a string, newest result first (W=Win, D=Draw, L=Loss), e.g. 'WDWWD' means the most recent match was a Win, then a Draw, etc.

match_ids

int[]

IDs of the matches included in the trend window

pct_1st_hf_o_05

float

Percentage of matches where first half total goals were over 0.5 (i.e. at least 1 goal)

pct_1st_hf_o_15

float

Percentage of matches where first half total goals were over 1.5 (i.e. at least 2 goals)

pct_1st_hf_o_25

float

Percentage of matches where first half total goals were over 2.5 (i.e. at least 3 goals)

pct_1st_hf_u_05

float

Percentage of matches where first half total goals were under 0.5 (i.e. exactly 0 goals)

pct_1st_hf_u_15

float

Percentage of matches where first half total goals were under 1.5 (i.e. 0 or 1 goal)

pct_1st_hf_u_25

float

Percentage of matches where first half total goals were under 2.5 (i.e. 0, 1, or 2 goals)

pct_2nd_hf_o_05

float

Percentage of matches where second half total goals were over 0.5 (i.e. at least 1 goal)

pct_2nd_hf_o_15

float

Percentage of matches where second half total goals were over 1.5 (i.e. at least 2 goals)

pct_2nd_hf_o_25

float

Percentage of matches where second half total goals were over 2.5 (i.e. at least 3 goals)

pct_2nd_hf_u_05

float

Percentage of matches where second half total goals were under 0.5 (i.e. exactly 0 goals)

pct_2nd_hf_u_15

float

Percentage of matches where second half total goals were under 1.5 (i.e. 0 or 1 goal)

pct_2nd_hf_u_25

float

Percentage of matches where second half total goals were under 2.5 (i.e. 0, 1, or 2 goals)

pct_bts

float

Percentage of matches where both teams scored (Both Teams to Score)

pct_draws

float

Percentage of matches that ended in a draw

pct_fts

float

Percentage of matches where the team failed to score (Failed To Score)

pct_losses

float

Percentage of matches that were losses

pct_o_05

float

Percentage of matches with over 0.5 total goals (i.e. at least 1 goal)

pct_o_15

float

Percentage of matches with over 1.5 total goals (i.e. at least 2 goals)

pct_o_25

float

Percentage of matches with over 2.5 total goals (i.e. at least 3 goals)

pct_o_35

float

Percentage of matches with over 3.5 total goals (i.e. at least 4 goals)

pct_u_05

float

Percentage of matches with under 0.5 total goals (i.e. exactly 0 goals)

pct_u_15

float

Percentage of matches with under 1.5 total goals (i.e. 0 or 1 goal)

pct_u_25

float

Percentage of matches with under 2.5 total goals (i.e. 0, 1, or 2 goals)

pct_u_35

float

Percentage of matches with under 3.5 total goals (i.e. 0, 1, 2, or 3 goals)

pct_wins

float

Percentage of matches that were wins

team_id

int

Internal identifier of the team

window_end_date

date

Date of the most recent match included in the trend window

window_start_date

date

Date of the oldest match included in the trend window"

"Team
Overview
You use the Team resource to access base information about that very team, it’s squad, the running competitions it is participating this season or you might be interested in it’s latest matches.

Enough said, see the entire beauty of the Team resource resource below.

curl -XGET 'https://api.football-data.org/v4/teams/90' -H "X-Auth-Token: UR_TOKEN"
{
    "area": {
        "id": 2224,
        "name": "Spain",
        "code": "ESP",
        "flag": "https://crests.football-data.org/760.svg"
    },
    "id": 90,
    "name": "Real Betis Balompié",
    "shortName": "Real Betis",
    "tla": "BET",
    "crest": "https://crests.football-data.org/90.png",
    "address": "Avenida de Heliópolis, s/n Sevilla 41012",
    "website": "http://www.realbetisbalompie.es",
    "founded": 1907,
    "clubColors": "Green / White",
    "venue": "Estadio Benito Villamarín",
    "runningCompetitions": [
        {
            "id": 2014,
            "name": "Primera Division",
            "code": "PD",
            "type": "LEAGUE",
            "emblem": "https://crests.football-data.org/PD.png"
        },
        {
            "id": 2146,
            "name": "UEFA Europa League",
            "code": "EL",
            "type": "CUP",
            "emblem": "https://crests.football-data.org/EL.png"
        },
        {
            "id": 2079,
            "name": "Copa del Rey",
            "code": "CDR",
            "type": "CUP",
            "emblem": null
        }
    ],
    "coach": {
        "id": 11630,
        "firstName": "Manuel",
        "lastName": "Pellegrini",
        "name": "Manuel Pellegrini",
        "dateOfBirth": "1953-09-16",
        "nationality": "Chile",
        "contract": {......."
"List Resource
A list resource is available to fetch just all teams available.

Matches
You can use the Match Subresource to fetch a list of matches that are pre-filtered by the team.

Click here to see a sample implementation (at the very bottom) with some layers of plumbing and transformation code in between.

curl -XGET 'https://api.football-data.org/v4/teams/583/matches?dateFrom=2021-07-01&dateTo=2022-01-01' -H "X-Auth-Token: UR_TOKEN"
Notice the matches are lacking lineups, bookings and so on as we did not set the unfolding headers as explained here.

{
    "filters": {
        "dateFrom": "2021-07-01",
        "dateTo": "2022-01-01",
        "permission": "TIER_THREE",
        "limit": 100
    },
    "resultSet": {
        "count": 15,
        "competitions": "PPL",
        "first": "2021-08-07",
        "last": "2021-12-28",
        "played": 15,
        "wins": 6,
        "draws": 6,
        "losses": 7
    },
    "matches": [ ... ]
}
You see the applied filters on the very top: by default the list is limited to 100 items. this, this is season 2021/22. And we explicitly defined to return only matches of matchday 23. The resultSet node gives the boundaries of the match list, a count and how many matches are in status FINISHED. Last but not least the list of match items follows.

Available filters for Match Subresource
Filter name	Possible values	Sample
dateFrom

A date in format yyyy-MM-dd

/?dateFrom=2022-01-01

dateTo

A date in format yyyy-MM-dd

/?dateTo=2022-01-10

season

An integer, like [\d]{4}

/?season=2021

status

Status enum

/?status=FINISHED

venue

Enum [ HOME | AWAY ]

/?venue=HOME

limit

Integer [1-500]

Limit the result set

This page was built using the wonderful Antora project."