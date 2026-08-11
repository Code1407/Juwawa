set "DOC_DIR=E:\Project\WorkSpace\DocDesign"
set "GAME_ROOT=E:\Project\WorkSpace\Project\Seven7"
set "GAME_ID=1"

git -C "%DOC_DIR%" pull
"%DOC_DIR%/RandomTool/excel-tool.exe" --excel "%DOC_DIR%/RandomTool/Game.%GAME_ID%/excel"  --client "%GAME_ROOT%/Seven7/assets/bundles/config/game" --ts "%GAME_ROOT%/Seven7/assets/script/table" --server "%GAME_ROOT%/server/configs/base" --lang "%GAME_ROOT%/Seven7/assets/bundles/config/language" --initlang "%GAME_ROOT%/Seven7/assets/resources"
pause