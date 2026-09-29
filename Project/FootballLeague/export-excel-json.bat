set "DOC_DIR=D:\Work\DocDesign"
set "GAME_ROOT=D:\Work\Project\FootballLeague"
set "GAME_ID=67"

git -C "%DOC_DIR%" pull
"%DOC_DIR%/RandomTool/excel-tool.exe" --excel "%DOC_DIR%/RandomTool/Game.%GAME_ID%/excel"  --client "%GAME_ROOT%/FootballLeague/assets/bundles/config/game" --ts "%GAME_ROOT%/FootballLeague/assets/script/table" --server "%GAME_ROOT%/server/configs/base" --lang "%GAME_ROOT%/FootballLeague/assets/bundles/config/language" --initlang "%GAME_ROOT%/FootballLeague/assets/resources"
pause