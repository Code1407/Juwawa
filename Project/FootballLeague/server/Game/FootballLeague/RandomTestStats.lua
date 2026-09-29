-- RandomTest 只接受 GenRandom 的单个返回值；此模块在不改变原汇总口径的前提下，
-- 同步记录三个场景的独立返奖率。
RandomTestStats = {}

local SCENE_NORMAL = EGameScene and EGameScene.Normal or 1
local SCENE_ADVANCED = EGameScene and EGameScene.Advanced or 2
local SCENE_MASTER = EGameScene and EGameScene.Master or 3
local SCENE_NAMES = {
    [SCENE_NORMAL] = "Normal",
    [SCENE_ADVANCED] = "Advanced",
    [SCENE_MASTER] = "Master（含JP）",
}

local function getRandomTestCount()
    local file = io.open("RandomTest.cfg", "r")
    if not file then
        return nil
    end

    local content = file:read("*a")
    file:close()
    return tonumber(content:match('"count"%s*:%s*(%d+)'))
end

function RandomTestStats:init(price)
    if self.inited then
        return
    end

    self.inited = true
    self.price = tonumber(price) or 0
    self.targetCount = getRandomTestCount()
    self.count = 0
    self.sceneWin = {}
    self.sceneStats = {}
    self.masterJPWin = 0
    self.masterJPCount = 0
end

function RandomTestStats:record(sceneType, win)
    self.sceneWin[sceneType] = (self.sceneWin[sceneType] or 0) + win

    local stats = self.sceneStats[sceneType]
    if not stats then
        stats = {
            winCount = 0,
            notBreakEvenCount = 0,
            noWinCount = 0,
            oneToThreeCount = 0,
            threeToFiveCount = 0,
            fiveOrMoreCount = 0,
        }
        self.sceneStats[sceneType] = stats
    end

    if win <= 0 then
        stats.noWinCount = stats.noWinCount + 1
        return
    end

    stats.winCount = stats.winCount + 1
    local multiple = self.price > 0 and win / self.price or 0
    if multiple < 1 then
        stats.notBreakEvenCount = stats.notBreakEvenCount + 1
    elseif multiple < 3 then
        stats.oneToThreeCount = stats.oneToThreeCount + 1
    elseif multiple < 5 then
        stats.threeToFiveCount = stats.threeToFiveCount + 1
    else
        stats.fiveOrMoreCount = stats.fiveOrMoreCount + 1
    end
end

function RandomTestStats:recordMasterJP(win)
    self.masterJPWin = self.masterJPWin + win
    self.masterJPCount = self.masterJPCount + 1
end

function RandomTestStats:finishIfNeeded()
    self.count = self.count + 1
    -- 随机测试框架在不同版本中可能多调用一次；达到目标次数即落盘，避免错过输出。
    if self.written or not self.targetCount or self.count < self.targetCount then
        return
    end
    self.written = true

    local totalBet = self.price * self.targetCount
    if totalBet <= 0 then
        log_error("RandomTest scene RTP output skipped: invalid total bet")
        return
    end

    local file = io.open("scene_rtp.csv", "w")
    if not file then
        log_error("RandomTest scene RTP output failed: cannot open scene_rtp.csv")
        return
    end

    local function writeCountLine(label, value)
        file:write(string.format("%s：,%d,%.6f%%\n", label, value, value / self.targetCount * 100))
    end

    for sceneType = SCENE_NORMAL, SCENE_MASTER do
        local win = self.sceneWin[sceneType] or 0
        local rate = win / totalBet * 100
        local stats = self.sceneStats[sceneType] or {}
        -- 与 RandomTest 原始汇总区块保持完全相同的标题，场景名只作为区块前缀。
        file:write(string.format("%s\n", SCENE_NAMES[sceneType]))
        file:write("数据来源：,汇总\n")
        file:write(string.format("运行次数：,%d\n", self.targetCount))
        file:write("免费次数：,0\n")
        file:write(string.format("返奖率：,%.6f%% [%.6f/%.0f]\n", rate, win, totalBet))
        writeCountLine("中奖次数", stats.winCount or 0)
        writeCountLine("中奖不回本次数", stats.notBreakEvenCount or 0)
        writeCountLine("不中奖次数", stats.noWinCount or 0)
        writeCountLine("中奖1-3倍次数", stats.oneToThreeCount or 0)
        writeCountLine("中奖3-5倍次数", stats.threeToFiveCount or 0)
        writeCountLine("中奖5倍以上次数", stats.fiveOrMoreCount or 0)
        file:write("是否溢出：,false,0\n\n")
    end
    file:close()

    log_info(string.format("Normal返奖率:%.6f%%，Advanced返奖率:%.6f%%，Master（含JP）返奖率:%.6f%%",
        (self.sceneWin[SCENE_NORMAL] or 0) / totalBet * 100,
        (self.sceneWin[SCENE_ADVANCED] or 0) / totalBet * 100,
        (self.sceneWin[SCENE_MASTER] or 0) / totalBet * 100))
end
