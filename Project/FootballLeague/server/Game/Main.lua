
require "GameApp"
require "Rank.RankCommon"
require "Mail.MailSystem"
require "FootballLeague.FootballLeagueMain"
require "FootballLeague.GameRankMgr"

gApp = GameApp()
RankCommon()
MailSystem()

FootballLeagueMain()
GameRankMgr()
