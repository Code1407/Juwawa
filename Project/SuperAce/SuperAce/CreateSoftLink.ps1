# 获取当前路径
$currentPath = $PWD.Path

# 将当前路径转换为CMD接受的路径格式（如果需要的话）
# 例如，如果路径包含空格，需要加上双引号

$source0 = '"' + $currentPath + '\..\..\Loader\LoaderCocos2\assets\shared"'
$link0 = '"' + $currentPath + '\assets\shared"'

$source1 = '"' + $currentPath + '\..\..\Loader\LoaderCocos2\assets\shared2"'
$link1 = '"' + $currentPath + '\assets\shared2"'

$source2 = '"' + $currentPath + '\..\..\Loader\LoaderCocos2\assets\shared3"'
$link2 = '"' + $currentPath + '\assets\shared3"'
# 浠ョ鐞嗗憳鏉冮檺鍚姩CMD锛屽苟瀵艰埅鍒板綋鍓嶈矾寰?
Start-Process cmd -ArgumentList "/k (if exist $link0 (rd $link0) else (echo $link0 not exists)) & mklink /D $link0 $source0 & exit" -Verb runAs

Start-Process cmd -ArgumentList "/k (if exist $link1 (rd $link1) else (echo $link1 not exists)) & mklink /D $link1 $source1 & exit" -Verb runAs

Start-Process cmd -ArgumentList "/k (if exist $link1 (rd $link2) else (echo $link2 not exists)) & mklink /D $link2 $source2 & exit" -Verb runAs