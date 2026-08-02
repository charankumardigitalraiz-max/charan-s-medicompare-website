export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22
node -v
git fetch origin main
git reset --hard origin/main
npm i -f
npm run build:dev
