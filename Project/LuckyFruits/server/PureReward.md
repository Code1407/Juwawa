# 预编译奖励配置

- [预编译奖励配置](#预编译奖励配置)
  - [如何运行](#如何运行)
  - [如何编写生成逻辑](#如何编写生成逻辑)
  - [工具内Lua相关接口](#工具内lua相关接口)
    - [`gRandom`](#grandom)
    - [`json`](#json)
    - [`gConfigMgr`](#gconfigmgr)
    - [`push_item(reward, data)`](#push_itemreward-data)
    - [`push_tag_item(tag, reward, data)`](#push_tag_itemtag-reward-data)
    - [`hash(str)`](#hashstr)
  - [游戏内相关接口](#游戏内相关接口)
    - [`getReward(multiple)`](#getrewardmultiple)
    - [`getTagReward(tag, multiple)`](#gettagrewardtag-multiple)

## 如何运行

- 双击运行`build_reward.bat`即可运行
- 配置文件为`PureReward.cfg`，开发中一般`items`只会有一个配置项，发布生成时`items`中会包括所有需要发布的游戏配置。
- Lua文件根目录。默认使用当前目录下的`Game`目录做为Lua文件的根目录，如需修改，可以修改`PureReward.cfg`文件中`items[0].luaDir`字段参数。
- 运行的Lua文件。默认运行`GenReward.lua`文件，如需修改，可以修改`PureReward.cfg`文件中`items[0].runLua`字段参数。
- 生成位置。默认生成在`Rewards`目录下，如需修改，可以修改`PureReward.cfg`文件件中`items[0].saveDir`字段参数。
- 游戏配置。此工具会加载游戏内的配置，以保证运行时和工具使用同样的参数。默认加载`configs`目录下的配置，如需修改，可以修改`PureReward.cfg`文件中`items[0].cfgDir`字须参数。
- 生成配置总量。默认生成10000000条配置后会终止，如需修改，可以修改`PureReward.cfg`文件件中`items[0].allCount`字须参数。

## 如何编写生成逻辑

配置生成逻辑由运行时指定的Lua文件处理，默认为`GenReward.lua`文件。
工具会自动调用全局函数`Run(allCount)`，参数为工具配置里的`items[0].allCount`，表示生成数据条数，各个游戏根据自己的逻辑处理数量，但是必须生成的数据条数被会此参数影响。此函数返回即为配置生成完成，各个游戏依据自己的逻辑生成。

## 工具内Lua相关接口

### `gRandom`

随机数生成器，用法同游戏内的`gRandom`，用法和接口都一样， 具本参见游戏开发文档。

### `json`

json数据序列化和反序列化接口，用法同游戏内的`json`，只有两个接口`json.encode`和`json.decode`，具体参见游戏开发文档。

### `gConfigMgr`

游戏逻辑配置管理器，用法同游戏内的`gConfigMgr`。用法和接口都一样，具体参见游戏开发文档。

### `push_item(reward, data)`

推送无tag配置接口，参数`reward`为产出倍数，必须为整数。参数`data`为产出倍数对应的配置，必须是一个json类型的字符串，但是类型为`PureCore.DataRef`，一般是通过`json.encode`将lua对像序列化得到的结果。无返回值。

### `push_tag_item(tag, reward, data)`

推送带tag配置接口，参数`tag`为标签，字符串，由各个游戏自行定义。参数`reward`为产出倍数，必须为整数。参数`data`为产出倍数对应的配置，必须是一个json类型的字符串，但是类型为`PureCore.DataRef`，一般是通过`json.encode`将lua对像序列化得到的结果。无返回值。

### `hash(str)`

计算字符串的哈希值，参数`str`必须为字符串。返回值为整数。

## 游戏内相关接口

游戏内的所有数由`gRewardMgr`对像管理。其提供两个接口分别用于普通数据和带标签组的数据管理

### `getReward(multiple)`

随机获取普通数据项，参数`multiple`为倍数。其返回值与工具生成的数据格式一致，由各个游戏自行处理。注意，有可能返回`nil`，此时表示没有对应倍数的数据，一般情况下可以缩小倍数再次获取，缩小间隔由各个游戏自己逻辑来确定。

### `getTagReward(tag, multiple)`

随机获取普通数据项，参数`tag`为标签组，其意义由各个游戏自己定义自己处理，与工具中的`tag`保持一致即可。参数`multiple`为倍数。其返回值与工具生成的数据格式一致，由各个游戏自行处理。注意，有可能返回`nil`，此时表示没有对应倍数的数据，一般情况下可以缩小倍数再次获取，缩小间隔由各个游戏自己逻辑来确定。