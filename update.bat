@echo off
echo Starting directory restructuring...

:: Create new directory structure
mkdir "src\app" 2>nul
mkdir "src\app\api" 2>nul
mkdir "src\app\api\auth" 2>nul
mkdir "src\app\(auth)" 2>nul
mkdir "src\app\(auth)\login" 2>nul
mkdir "src\components" 2>nul
mkdir "src\lib" 2>nul
mkdir "src\types" 2>nul
mkdir "src\utils" 2>nul
mkdir "tests" 2>nul

:: Move app files to src/app
move "app\layout.tsx" "src\app\" 2>nul
move "app\page.tsx" "src\app\" 2>nul
move "app\(auth)\login\page.tsx" "src\app\(auth)\login\" 2>nul
move "app\api\auth\[...nextauth]\route.ts" "src\app\api\auth\" 2>nul

:: Move components
move "components\player" "src\components\" 2>nul

:: Move lib files
move "lib\auth\*" "src\lib\" 2>nul

:: Move types
move "src\types\spotify\*" "src\types\" 2>nul

:: Move tests
move "src\__tests__\*" "tests\" 2>nul

:: Clean up empty directories
rmdir /s /q "app" 2>nul
rmdir /s /q "components" 2>nul
rmdir /s /q "lib" 2>nul

:: Move core services to better locations
move "src\core\auth\*" "src\lib\auth\" 2>nul
move "src\core\http\*" "src\lib\http\" 2>nul
move "src\core\logging\*" "src\lib\logging\" 2>nul
move "src\services\*" "src\lib\services\" 2>nul

echo Directory restructuring complete!