#! /bin/bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.9/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm install 8

sudo apt-get -f update
sudo apt-get -f upgrade
sudo apt-get -f install git

git clone https://github.com/nathanbenabou/orange.git
cd orange
npm install
node request.js $1 $2 $3 $4 $5 >& log.txt
