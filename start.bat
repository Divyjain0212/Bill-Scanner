@echo off
echo Starting Bill Scanner Application...

echo Starting Server...
start cmd /k "cd server && npm start"

echo Starting Client...
start cmd /k "cd client && npm run dev"

echo Application started! You can close this window now.
