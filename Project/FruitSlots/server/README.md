# 游戏服务器文档

- [游戏服务器文档](#游戏服务器文档)
  - [如何启动游戏服务器](#如何启动游戏服务器)
  - [游戏服务器配置说明](#游戏服务器配置说明)
  - [游戏服务器全局相关接口](#游戏服务器全局相关接口)
    - [`app__`](#app__)
    - [`class__`](#class__)
    - [`log_view`](#log_view)
    - [`log_info`](#log_info)
    - [`log_warn`](#log_warn)
    - [`log_error`](#log_error)
    - [`json`](#json)
    - [`GenUnionIncrId(incrId)`](#genunionincridincrid)
    - [`GenDayIncrId(unionIncrId)`](#gendayincridunionincrid)
    - [`gConfig`](#gconfig)
    - [`gRandom`](#grandom)
    - [`gTimer`](#gtimer)
    - [`gWorld`](#gworld)
    - [`gConfigMgr`](#gconfigmgr)
  - [游戏服务器App](#游戏服务器app)
  - [游戏服务器消息路由](#游戏服务器消息路由)
    - [通信协议定义](#通信协议定义)
    - [接收客户端消息](#接收客户端消息)
    - [发送客户端消息](#发送客户端消息)
  - [游戏服务器玩家系统](#游戏服务器玩家系统)
    - [玩家模块](#玩家模块)
    - [玩家系统模块](#玩家系统模块)
  - [游戏服务器全服系统](#游戏服务器全服系统)
  - [游戏服务器全游戏系统](#游戏服务器全游戏系统)
  - [游戏服务器全平台系统](#游戏服务器全平台系统)
  - [游戏数据统计](#游戏数据统计)
    - [玩家数据统计](#玩家数据统计)
    - [服务器数据统计](#服务器数据统计)
  - [游戏数值调控](#游戏数值调控)
    - [数据相关接口](#数据相关接口)
    - [多人游戏调控](#多人游戏调控)
    - [单人游戏调控](#单人游戏调控)

## 如何启动游戏服务器

- 将本目录下所有文件复制到游戏仓库
- 修改Game.cfg配置，将`@time_zone@`修改为指定时区(-12到12)，正为东区，负为西区，将`@server_id@`修改为对应的游戏id，并将`@ip@`修改为本机ip地址
- 双击run.bat即可运行服务器
- 日志位于当前目录的子目录`logs/Game/`
- 游戏配置位于当前目录的子目录`configs/`，此目录下再新建文件夹，文件夹名为游戏配置的标签
- 游戏逻辑代码位于当前目录的子目录`Game/`下，里面有一部分框架自带的代码，在此基础上写游戏的逻辑代码

## 游戏服务器配置说明

Game.cfg配置格式为json，分为四个部分：

1. `log`字段，日志配置，为数组类型，每个配置项为一个日志输出通道。配置项类型(`type`字段)有`stdout`、`hourly_file`、`rotating_file`三种类型。

    ```
    stdout类型: {"type": "stdout", "level": "info", "color": true}
        控制台日志，type为类型，level为输出日志级别，color为是否区分颜色。

    hourly_file类型：{"type": "hourly_file", "level": "info", "path": "path/to/name.log"}
        按小时分割文件日志，type为类型，level为输出日志级别，path为日志输出文件路径。

    rotating_file类型：{"type": "rotating_file", "level": "info", "path": "path/to/name.log", "maxSize": 10240000, "maxCount": 100}
        按大小分割文件日志，type为类型，level为输出日志级别，path为日志输出文件路径，maxSize为文件分割大小，maxCount为保留文件数量。
    ```

2. `app`字段，服务器配置，为Object类型。`name`字段指定服务名，`server_type`指定服务类型，`server_id`指定服务id（对应不同的游戏），`server_index`指定服务索引（对应相同游戏的不同结点），`env`指定服务环境（`develop`,`test`,`product`）。
3. `lua_path`字段，脚本加载配置，为数组类型，每个配置项为一个加载类型。配置项类型（`type`字段）有`dir`、`pkg`、`file`三种类型。

   ```
    dir类型：{"type": "dir", "path": "Common/"}
        增加搜索目录，path指向需要搜索的目录。
    pgk类型：{"type": "pkg", "path": "Common.zip"}
        增加搜索文件包，path指向需要搜索的文件包
    file类型：{"type": "file", "path": "Main"}
        增加初始化完成后加载的脚本文件，path指向需要加载的脚本名
   ```

4. `lua_cfg`字段，脚本配置，为Object类型，其数据对应脚本中的全局变量`gConfig`。

   ```
    gates，数组类型，指定所有网关地址端口及key
    db, Object类型，指定数据服ip端口及key
    gamecenter, Object类型，指定中心服ip端口及key
    game, Object类型，指定主服务器监听ip端口及key
    reconnect_interval，数字，指定重连间隔毫秒数
    redis，Object对像，指定redis连接信息
    configs，数组，指定游戏逻辑配置，会自动加载，其类型同lua_path配置项
    player_live, 数字，指定玩家多久没消费被踢下线，单位秒
    dbgPort，数字，指定VSCode调试端口，如果不指定或数值<=0则使用内建调试器
    waitIDE，布尔值，指定是否等待VSCode调试连接后，再继续执行，只有dbgPort>=0才会起效
   ```

## 游戏服务器全局相关接口

### `app__`

    全局唯一对像，接口如下：

- `time()`，获取当前时间戳（秒），返回一个双精度浮点数，时间精度为微秒级。
- `set_time(t)`，设置当前时间（秒），参数`t`为双精度浮点数，可识别时间精度微秒级。
- `time_s()`，获取当前时间戳（秒），返回一个整数，时间精度为秒级。
- `time_milli_s()`，获取当前时间戳（毫秒），返回一个整数，时间精度为毫秒级。
- `time_micro_s()`，获取当前时间戳（微秒），返回一个整数，时间精度为微秒秒级。
- `utc_s()`，获取UTC0当前时间戳（秒），返回一个整数，时间精度为秒级。
- `utc_milli_s()`，获取UTC0当前时间戳（毫秒），返回一个整数，时间精度为毫秒级。
- `utc_micro_s()`，获取UTC0当前时间戳（微秒），返回一个整数，时间精度为微秒秒级。
- `time_zone()`，服务器当前时区。

### `class__`

    内部关键字，用于定义类，以函数方式调用，参数为需要继承的基类(只支持单一继承)，可以不指定。一般情况下，定义类需要定义方法`ctor__`，此为构造函数，在生成此类对像时会自动调用，注意在此构造方法中一般需要调用基类的`ctor__`方法。可以以调用函数的方法调用类来生成此类的对像。示例：
    ```
    --基类
    Base = class__()
    function Base:ctor__(arg1)
        self.arg1 = arg1
    end

    --派生类
    DivClass = class__(Base)
    function DivClass:ctor__(arg1, arg2)
        Base.ctor__(self, arg1) --调用基类构造函数
        self.arg2 = arg2
    end

    --生成基类对像
    local base = Base(100)
    log_info("base arg1 = {}", base.arg1)

    --生成派生类对像
    local div = DivClass(1000, 2000)
    log_info("div arg1 = {}, arg2 = {}", div.arg1, div.arg2)
    ```

### `log_view`

    全局函数，可将lua的表转义成字符串，一般配合日志输出函数调用，谨慎使用，表数据过我会影响性能。

### `log_info`

    常规日志输出函数，第一个参数必须为格式化字符串。格式化字符串中可使用`{}`占位，会被后续参数替换。示例
    ```
    log_info("this is a info log") --无占位，可直接输出字符串日志
    log_info("this is a info log, value1 = {}, value2 = {}, value3 = {}", 100, "this is string", log_view({key1 = 100, key2 - 200})) --使用占位
    log_info("this is left {{, this is right }}") --转义占位符，{{转义为左花括号，}}转义为右花括号，不再是占位符
    ```

### `log_warn`

    警告日志输出函数，格式及转义规则同`log_info`。

### `log_error`

    错误日志输出函数，格式及转义规则同`log_error`

### `json`

    json数据序列化和反序列化

- `json.encode(obj)`，序列化lua对像，将lua对像序列化为json。参数为lua对像，返回`PureCore.DynamicBuffer`对像，可调用其`bytes()`方法，返回字符串。
- `json.decode(data)`，反序列化json，将json反序列化为lua对像。参数为json数据，类型为`PureCore.DataRef`，可使用字符串构造`PureCore.DataRef("{\"aaaa\": 100}")`。

### `GenUnionIncrId(incrId)`

    根据每天的自增Id生成唯一自增Id，实际上高32位是日期，低32位是自增Id。

### `GenDayIncrId(unionIncrId)`

    根据唯一自增Id得到原生的自增Id，实际是直接`unionIncrId & 0xffffffff`即可

### `gConfig`

    对应服务器配置中的`lua_cfg`字段的Object数据

### `gRandom`

    随机数生成器，接口如下：

- `gen_int()`，生成整型随机数，范围为uint32的所有整数。
- `gen_float()`，生成浮点随机数，范围为0.0-1.0之间的所有浮点数。
- `gen_less_int(max)`，生成整型随机数，范围为0-max之间的所有整数。
- `gen_between_int(min, max)`，生成整型随机数，范围为min-max之间的所有整数。
- `gen_less_float(max)`，生成浮点随机数，范围为0.0-max之间的所有浮点数。
- `gen_between_float(min, max)`，生成浮点随机数，范围为min-max之间的所有浮点数。

### `gTimer`

    全局定时器，接口如下：

- `addOnceTimer(interval, func)`，增加单次定时器，参数`interval`为回调间隔，参数`func`为回调函数，返回生成的定时器id。
- `addTimer(start, interval, count, func)`，增加循环定时器，参数`start`为第一次间隔，参数`interval`为后续循环回调间隔，参数`count`为循环次数(-1永久循环),参数`func`为回调函数，返回生成的定时器id。
- `removeTimer(tId)`，删除定时器，参数`tId`为定时器id。

### `gWorld`

    全服玩家容器，用来管理当前在线和缓存的所有玩家。接口如下：

- `findPlayer(pId)`，通过pId查找在线玩家
- `findPlayerByUid(uId)`，通过uId查找在线玩家
- `findOfflinePlayer(pId)`，通过pId查找缓存的离线玩家
- `findOfflinePlayerByUid(uId)`，通过uId查找缓存的离线玩家
- `findAllPlayer(pId)`，通过pId查找所有在内存中的玩家
- `findAllPlayerByUid(uId)`，通过uId查找所有在内存中的玩家
- `hasPlayer()`，是否存在在线玩家
- `hasOfflinePlayer()`，是否存在缓存的离线玩家

### `gConfigMgr`

    配置管理器，用来管理游戏逻辑配置，可以存在多套表，以标签区分。游戏中访问配置表时，只能使用此管理器来访问，接口如下：

- `getBaseConfig(name)`，获取基础配置表数据，`name`为表名。此接口会获取标签为`base`的配置表数据
- `getHighConfig(name)`，获取高配配置表数据，`name`为表名。此接口会获取标签为`high`的配置表数据
- `getConfigByTag(tag, name)`，获取对应标签的配置表数据，`tag`为标签名，`name`为表名。

## 游戏服务器App

一般情况下需要在GameApp.lua文件里定义GameApp类（模板已处理），此类会有一个全局对像，`gApp`。
`GameApp`类中有一些回调和函数可以使用：
- `onLoadConfig(tag, name, tab)`，加载配置的回调，在服务器启动时，或配置热更时会回调，`tag`为标签名（可同时存在多套表，以标签名区分），`name`为表名，`tab`为配置数据（以id为key的表）。如果对游戏逻辑需要对配置表做二次处理，则必须定义此回调，并在回调里做二次处理，否则热更配置时数据不会刷新。
- `onProjConfig()`，加载项目配置的回调，在服务器启动时，或后台修改项目配置时会回调。如果对游戏逻辑需要对项目配置做二次处理，则必须定义此回调，并在回调里做二次处理，否则后台修改项目配置时数据不会刷新。
- `getProjCommon()`，返回发布项目的项目公共配置，如果后台发布时没有配置任何配置则会是个空表。后台可能会配置`{Costs = {{Coins = 1, CostUrl = "http://127.0.0.1/1.png"}}, Custom = {}}`，指定档位。
- `getProjServer()`，返回发布项目的服务器配置，可能会配置`{Custom = {}}`。

## 游戏服务器消息路由

### 通信协议定义

客户端与服务器之间的通信需要定义相关协议，才可以接收或发送。协议定义规则详细见文件`Defs.proto`。定义了协议后需要导出，需要运行`build_proto.bat`。注意需要在文件`PureProto.json`中指定导出文件的配置。`protos`字段为数组，指定需要导出的协议描述文件。`client`字段为字符串，指定导出的客户端协议保存路径。`server`字段为字符串，指定导出的服务器端协议保存路径。

### 接收客户端消息

服务器端接收到的消息，最终会回调到`Player`对像的方法中，方法名同上节定义的协议名。一般情况下，只需要在`PlayerMsg.lua`文件中，定义相应的方法来响应客户端的消息即可。示例：

```
--需要在协议描述文件中定义C2sUpdateCurBetInfo协议
--回调时，msg参数即为定义的C2sUpdateCurBetInfo对像
function Player:C2sUpdateCurBetInfo(msg)
    --处理消息
end
```

当客户端使用`reqMsg`来发送消息时，服务器端的响应函数必须返回一个对像，此对像会自动发送给客户端，此时客户端发送和消息和返回的对像是一一对应的。当客户端使用`pushMsg`来发送消息时，如果需要，服务器端可以自行发送消息到客户端，具体参见下一节。

### 发送客户端消息

服务器端使用`Router.Client.Name(data, target)`来向客户端发送消息。其中`Name`为定义的协议名。参数`data`为与定义的协议匹配的lua对像。参数`target`为接收对像。当向某一个玩家发送消息时，`target`为`Player`对像，即为在消息响应函数中的`self`。当向全服玩家发送消息时，`target`为`gWorld`。当向某些玩家发送消息时，可以使用`SendTarget`类来构造需要接收的玩家，示例：

```
local target = SendTarget() --构造接收对像
target:addPlayer(pId) --加入需要接收的玩家pId
target:addPlayers({pId1, pId2}) --加入多个需要接收的玩家
Router.Client.Name(data, target) --发送数据
```

注意，服务器端向客户端发送消息时，同种类型的发送方式可以保证时序性。比如向某一个玩家发送消息时，可以保存此玩家接收的时序性。向多个玩家广播消息时，同一个玩家接收时可以保证时序性。但是向单个玩家发送消息和向多个玩家广播消息之间是不能保证时序性的。

## 游戏服务器玩家系统

### 玩家模块

玩家模块代码位于`Player.lua`中，类为`Player`，继承自`PlayerBase`，一般情况下不需要添加额外代码，逻辑功能一般定义玩家系统模块来处理，详见下一节。玩家对像有一些已经定义的接口可以使用，其中以on开头的方法为回调方法，如果`Player`实现了该方法，必须在方法里调用基类`PlayerBase`的该方法。具体接口：

- `isOnline()`，玩家是否在线
- `getSystem(name)`，获玩家系统模块，参数`name`为系统名字
- `onLoad(data)`，玩家数据加载回调，参数`data`为加载的数据，为nil时，说明玩家第一次登录。注意，必须要调用基类的方法`PlayerBase.onLoad(self, data)`，才能将数据挂载到玩家上。
- `getData()`，获取玩家数据，可任意读写，数据会自动保存。
- `getPid()`，获取玩家的pId
- `getUid()`，获取玩家的uId
- `getName()`，获取玩家的名字
- `getAvatarUrl()`，获取玩家头像url
- `refreshSdk(cb)`，刷新sdk玩家信息，参数`cb`为回调（回调参数错误码、玩家）
- `getCoins()`，获取玩家积分
- `getVipLevel()`，获取玩家vip等级
- `getSdkState()`，获取当前sdk状态（0无效，1可用，2发生错误）。当状态为2时，服务器主动修正错误，在状态回到1之前，操作积分的接口是不可用的。已经定义枚举:

```
    ESdkState = {
        EInvalid = 0, --无效
        EValid = 1, --可用
        EError = 2, --发生错误
    }
```

- `addCoins(roundId, oddsType, changeType, coins, cb)`，获得积分，参数`roundId`为游戏当前局数，参数`oddsType`为货币操作类型，由调控接口返回的同名字段，参数`changeType`为获得原因，用于追踪积分，参数`coins`为获得数量，参数`cb`为回调（回调参数错误码、订单id、玩家），返回值为订单id。注意如果对是否执行成功不感兴趣，可以不指定回调。
- `subCoins(roundId, changeType, coins, cb)`，扣除积分，参数`roundId`为游戏当前局数，参数`changeType`为扣除原因，用于追踪积分，参数`coins`为扣除数量，参数`cb`为回调（回调参数错误码、订单id、玩家），返回值为订单id。注意如果对是否执行成功不感兴趣，可以不指定回调。
- `onOClock(hour)`，整点回调，参数`hour`为点数，必须调用基类的方法`PlayerBase.onOClock(self, hour)`。
- `addOnceTimer(interval, func)`，生成单次定时器，参数`interval`为时间间隔，参数`func`为回调函数，返回定时器id
- `addTimer(start, interval, count, func)`，生成循环定时器，参数`start`为首次间隔，参数`interval`为循环间隔，参数`count`为循环次数，参数`func`为回调函数，返回定时器id
- `removeTimer(tId)`，删除定时器，参数`tId`为定时器id
- `onEnter()`，玩家登录回调，必须调用基类方法`PlayerBase.onEnter(self)`。
- `onLeave()`，玩家离线回调，必须调用基类方法`PlayerBase.onLeave(self)`。
- `onCleanup()`，玩家从缓存移除回调，必须调用基类方法`PlayBase.onCleanup(self)`。
- `onCoinChanged()`，玩家积分发生变化的回调。
- `onSdkChanged()`，玩家sdk状态发生变化时回调。

### 玩家系统模块

和玩家相关的逻辑功能，一般定义玩家系统模块来处理。玩家系统模块必须继承自`SystemBase`。新定义的系统模块必须定义构造函数，并调用基类构造函数`SystemBase.ctor__(self, name, player)`，参数`name`为系统名字，参数`player`为玩家。一般会在玩家的构造函数（`Player:ctor`）中生成系统模块实例，后续可以使用`player:getSystem(name)`来获取对应的系统使用。玩家系统模块有一些已经定义的接口可以使用，其中以on开头的方法为回调方法，如果定义的系统模块实现了该方法，必须在方法里调用基类`SystemBase`的该方法。具体接口：

- `getPlayer()`，获取绑定的玩家
- `getData()`，获取系统数据，可任意读写，数据会自动保存。
- `resetData(data)`，重置需要保存的数据，参数`data`为需要保存的数据
- `onLoad(data)`，系统数据加载回调，参数`data`为加载的数据，为nil时，说明玩家第一次登录。注意，必须要调用基类的方法`SystemBase.onLoad(self, data)`，才能将数据挂载到系统上。
- `onEnter()`，玩家登录回调，必须调用基类方法`SystemBase.onEnter(self)`。
- `onLeave()`，玩家离线回调，必须调用基类方法`SystemBase.onLeave(self)`。
- `onCleanup()`，玩家从缓存移除回调，必须调用基类方法`PlayBase.onCleanup(self)`。
- `onOClock(hour)`，整点回调，参数`hour`为点数，必须调用基类的方法`SystemBase.onOClock(self, hour)`。
示例：

```
    -----------------------TestSystem.lua----------------------------
    --require基类
    require "GameBase.SystemBase"

    --定义新的系统模块类
    TestSystem = class__(SystemBase)

    --新的系统模块构造函数
    function TestSystem:ctor__(player)
        --调用基类构造函数
        SystemBase.ctor__(self, "Test", player)
    end

    --数据加载回调
    function TestSystem:onLoad(data)
        if not data then 
            data = {}
        end
        SystemBase.onLoad(self, data)
    end

    --玩家进入回调
    function TestSystem:onEnter()
        SystemBase.onEnter(self)
    end

    --玩家退出回调
    function TestSystem:onLeave()
        SystemBase.onLeave(self)
    end

    --整点回调
    function TestSystem:onOClock(hour)
        SystemBase.onOClock(self, hour)
    end

    --测试逻辑方法
    function TestSystem:test()

    end

    ------------------------Player.lua------------------------------
    function Player:ctor__(uId, pId)
        PlayerBase.ctor__(self, uId, pId)

        --构造系统模块实例
        TestSystem(self)
    end

    ------------------------PlayerMsg.lua------------------------------
    --测试调用系统模块
    function Player:TestFunc()
        local sys = self:getSystem("Test")
        sys:test()
    end
```

## 游戏服务器全服系统

某些游戏逻辑是全服逻辑，这时候一般定义全服系统模块来处理逻辑。全服系统模块必须继承自`SvrSystemBase`。新定义的系统模块必须定义构造函数，并调用基类构造函数`SvrSystemBase.ctor__(self, name)`，参数`name`为系统名字。一般会在`Main.lua`中生成系统模块实例。注意因为游戏服务器支持分布式扩展，因为全服系统模块相对于单一结点（服务器进程）唯一，对于游戏来说可能存在多个进程，如果需要相对于游戏的全游逻辑可参见下一节，跨服系统。
后续可以使用`SvrSystem.Name.FuncName(...)`来调用对应系统的方法。其中`Name`为构造系统时给的参数`name`。其中`FuncName`为对应全服系统模块的方法名，参数即为对应系统模块的方法参数，返回值即为对应系统模块方法的返回值。
全服系统模块有一些已经定义的接口可以使用，其中以on开头的方法为回调方法，如果定义的系统模块实现了该方法，必须在方法里调用基类`SvrSystemBase`的该方法。具体接口：

- `getData()`，获取系统数据，可任意读写，数据会自动保存。
- `resetData(data)`，重置需要保存的数据，参数`data`为需要保存的数据
- `onLoad(data)`，系统数据加载回调，参数`data`为加载的数据，为nil时，说明系统第一次加载。注意，必须要调用基类的方法`SvrSystemBase.onLoad(self, data)`，才能将数据挂载到系统上。
- `onOClock(hour)`，整点回调，参数`hour`为点数，必须调用基类的方法`SvrSystemBase.onOClock(self, hour)`。
- `onClose()`，服务器关闭回调，必须调用基类的方法`SvrSystemBase.onClose(self)`。
示例：

```
    -----------------------TestSystem.lua----------------------------
    --require基类
    require "GameBase.SvrSystemBase"

    --定义新的系统模块类
    TestSystem = class__(SvrSystemBase)

    --新的系统模块构造函数
    function TestSystem:ctor__()
        --调用基类构造函数
        SvrSystemBase.ctor__(self, "Test")
    end

    --数据加载回调
    function TestSystem:onLoad(data)
        if not data then 
            data = {}
        end
        SvrSystemBase.onLoad(self, data)
    end

    --整点回调
    function TestSystem:onOClock(hour)
        SvrSystemBase.onOClock(self, hour)
    end

    --服务器关闭回调
    function TestSystem:onClose(hour)
        SvrSystemBase.onClose(self, hour)
    end

    --测试逻辑方法
    function TestSystem:test(arg)
        return 10 * arg
    end

    ------------------------Main.lua------------------------------
    --构造系统模块实例
    TestSystem()

    ---------------------------任意地方调用------------------------------------
    --测试调用系统模块
    -- result为100
    local result = SvrSystem.Test.test(10)
```

## 游戏服务器全游戏系统

某些游戏逻辑是全游戏逻辑，这时候一般定义全游戏系统模块处理逻辑。全游戏系统模块必须继承自`GameSystemBase`。新定义的系统模块必须定义构造函数，并调用基类构造函数`GameSystemBase.ctor__(self, name)`，参数`name`为系统名字。一般会在`Main.lua`中生成系统模块实例。
后续可以使用`GameSystem.Name.FuncName(resp, ...)`来调用对应系统的方法。其中`Name`为构造系统时给的参数`name`。其中`FuncName`为对应全游戏系统模块的方法名，此方法第一个参数为结果回调函数，必须在完成此方法逻辑后调用（可异步调用），此回调函数实际与使用时的`resp`参数对应。参数`resp`为回调函数，`resp`的参数为对应系统模块方法的返回值。后续参数为对应系统模块方法的参数。注意，`resp`参数是必须存在的，如果不需要回调，可以给nil。
全游戏系统模块有一些已经定义的接口可以使用，其中以on开头的方法为回调方法，如果定义的系统模块实现了该方法，必须在方法里调用基类`GameSystemBase`的该方法。具体接口：

- `getData()`，获取系统数据，可任意读写，数据会自动保存。
- `resetData(data)`，重置需要保存的数据，参数`data`为需要保存的数据
- `onLoad(data)`，系统数据加载回调，参数`data`为加载的数据，为nil时，说明系统第一次加载。注意，必须要调用基类的方法`GameSystemBase.onLoad(self, data)`，才能将数据挂载到系统上。
- `onOClock(hour)`，整点回调，参数`hour`为点数，必须调用基类的方法`GameSystemBase.onOClock(self, hour)`。
- `onClose()`，服务器关闭回调，必须调用基类的方法`GameSystemBase.onClose(self)`。
示例：

```
    -----------------------TestSystem.lua----------------------------
    --require基类
    require "GameBase.GameSystemBase"

    --定义新的系统模块类
    TestSystem = class__(GameSystemBase)

    --新的系统模块构造函数
    function TestSystem:ctor__()
        --调用基类构造函数
        GameSystemBase.ctor__(self, "Test")
    end

    --数据加载回调
    function TestSystem:onLoad(data)
        if not data then 
            data = {}
        end
        GameSystemBase.onLoad(self, data)
    end

    --整点回调
    function TestSystem:onOClock(hour)
        GameSystemBase.onOClock(self, hour)
    end

    --服务器关闭回调
    function TestSystem:onClose(hour)
        GameSystemBase.onClose(self, hour)
    end

    --测试逻辑方法
    function TestSystem:test(cb, arg)
        cb(10*arg)
    end

    ------------------------Main.lua------------------------------
    --构造系统模块实例
    TestSystem()

    ---------------------------任意地方调用------------------------------------
    --测试调用系统模块
    --回调函数参数result为100，即为逻辑方法中的cb的参数
    GameSystem.Test.test(function(result) 

    end, 10)
```

## 游戏服务器全平台系统

某些游戏逻辑是全平台逻辑，这时候一般会根据需求提供系统和接口，直接调用即可。
首先需要先`require "GameBase.PlatSystem"`。调用方式`PlatSystem.Name.FuncName(resp, ...)`来调用对应系统的方法。其中`Name`为系统名。其中`FuncName`为系统方法名。参数`resp`为回调函数，`resp`的参数为对应系统模块方法的返回值。后续参数为对应系统模块方法的参数。注意，`resp`参数是必须存在的，如果不需要回调，可以给nil。


## 游戏数据统计

### 玩家数据统计

玩家的数据统计利用玩家（player）对像的方法调用。具体接口：

- `statis(statisId, data)`，推送玩家统计数据。`statisId`为统计Id。`data`为统计数据
  ```
    statisId = 22，全局排行榜领取奖励，data = {
        rank_type = isWeek and ERankType.rankWeek or ERankType.rankDay,  --string 日榜还是周榜
        day = _dateId(nowTime), --string 日期
        round = rankRoundId, --string 本地订单号
        uid = uid, --string 玩家uid
        score = score, --number 玩家得分
        bonus = bonus, --number 玩家奖金
        game_id = gameId, --string 游戏id
        save_time = nowTime, --number 保存时间
    }

    statisId = 23，全局排行榜领取奖励回调，data = {
        day = nowTime, -- string 日期
        round = rankRoundId,  -- string 本地订单号
        uid = uid, --string 玩家uid
        token = "", --string 交易token
        order_type = ETradeType.tradeOff, --string 交易类型
        order_id = localOrderId, --string 本地订单号
        diamond = bonus,
        response_id = orderID, --string 平台订单号
        account_diamond = accountDiamond, --number 账户余额
        game_id = gameId, --string 游戏id
        save_time = nowTime, --number 保存时间
    }

    statisId = 24，全局排行榜放弃奖励，data = {
        rank_type = isWeek and ERankType.rankWeek or ERankType.rankDay, --string 日榜还是周榜
        day = _dateId(nowTime), --string 日期
        round = 0, --string 本地订单号
        uid = uid, --string 玩家uid
        score = score, --number 玩家得分
        bonus = 0, --number 玩家奖金
        give_up_bonus = bonus, --number 放弃奖金
        game_id = gameId, --string 游戏id
        save_time = nowTime, --number 保存时间
    }
  ```

- `statisGameRound(round, pay, reward)`，推送玩家游玩一局游戏的数据（必须推送）。`round`游戏期数。`pay`玩家本局游戏消耗的积分。`reward`玩家本局游戏获得的奖励。

### 服务器数据统计

服务器的数据统计利用`gApp`对像的方法调用。具体接口：

- `statisGameRound(round, pay, reward)`，推送一局游戏的数据（多人游戏必须推送）。`round`游戏期数。`pay`本局游戏中所有玩家消耗的积分。`reward`本局游戏中所有玩家的奖励。
- `statisRewardPool(round, count)`，推送游戏内的奖池数据（有奖励池的游戏必须推送）。`round`游戏期数。`count`现在奖池积分总数。


## 游戏数值调控

所有的游戏都必须接入数值调控系统。调控系统为`gAnaly`对像，根游戏类型不同，使用不同的接口。

### 数据相关接口

- `getExchangeRate()`，返回货币比例，积分/美分
- `getCent(coins)`，返回积分对应的美分
- `getDollar(coins)`，返回积分对应的美元
- `getCoins(cent)`，返回美分对应的积分
- `isPlayerProfit(player)`返回玩家是否在本游戏盈利

### 多人游戏调控

- `multiAnaly(playerTab, roundId)`，获取本局游戏的调控信息，根据返回的信息对产出做出限制。`playerTab`参数为参与本局游戏的玩家列表（`{[pid] = player}`）。`roundId`参数为局数。
  返回值：

  ```
  {
    bool special, --是否优先中特殊奖
    number rewardMax, --本局游戏能获得的奖励上限
    number analyType, --玩家调控类型（0：不限制，1：放水，2：收割）
    number oddsType, --货币操作类型，用于sdk操作货币参数
    number rerankType, --放水策略（0：无效，1：盈利玩家盈利金额和最大，2：盈利玩家vip等级和最大，3：盈利玩家数量最多）
  }
  ```

- `multiCommitAnaly(playerTab, rewardTab, roundId, result)` 提交结算数据。`playerTab`参数为参与本局游戏的玩家列表（`{[pid] = player}`）。`rewardTab`参数为参与本局游戏的奖励列表（`{[pid] = reward}`）。`roundId`参数为局数。`result`参数为调控结果。
  ```
    --调控结果
    GameOddsResult = {
        --未知
        Unknown = 0,
        --成功
        Success = 1,
        --由于超过随机次数失败
        RerandomMax = 1,
        --由于尺度限制失败
        RulerMax = 2,
        -- Slot占用
        SlotBusy = 3,
    }
  ```

注意：以上两个接口必须成对出现，如果所有的方案都无法达成，则使用系统亏损最少方案。

### 单人游戏调控

- `singleAnaly(player, roundId)`，获取本局游戏的调控信息，根据返回的信息对产出做出限制。`player`参数为玩家对像。`roundId`参数为局数。
  返回值：
  ```
  {
    number pId, --玩家的pid
    number rewardMax, --玩家能获得的奖励上限
    number rewardMultiple, --建议中奖倍数
    number analyType, --玩家调控类型（0：不限制，1：放水，2：收割）
    number oddsType, --货币操作类型，用于sdk操作货币参数
    bool high, --是否使用高配表
    bool special, --是否优先中特殊奖
    bool random, --是否优先自己随机
    number rerandomRate, --重随概率万分比
    number rerandomMax, --重随最大次数
  }
  ```

- `singleCommitAnaly(player, reward, roundId, result)` 提交结算数据。`player`参数为玩家对像。`reward`参数为本次获得的奖励。`roundId`参数为局数。`result`参数为调控结果。
  ```
    --调控结果
    GameOddsResult = {
        --未知
        Unknown = 0,
        --成功
        Success = 1,
        --由于超过随机次数失败
        RerandomMax = 1,
        --由于尺度限制失败
        RulerMax = 2,
        -- Slot占用
        SlotBusy = 3,
    }
  ```

注意：以上两个接口必须成对出现。