#!/bin/bash

### cdktf check
if [ ! -e node_modules ]||[ ! -e node_modules/cdktf ];
then
echo "node_modules is not be found in this scripts' directory or it seems that cdktf has not been installed yet."
sleep 1
echo "If you want to install cdktf, we implement implement \"npm install cdktf-cli@latest\""
sleep 1
echo "Will you install cdktf? (yes/no)" 
read answer
case "$answer" in
    [Yy][Ee][Ss]|[Yy])
    
        npm install cdktf-cli@latest
        exit 0
        ;;
    [Nn][Oo]|[Nn])
        echo "Installation aborted."
        exit 0
        ;;
    *)
        echo "Invalid input. Please answer yes or no."
        exit 1
        ;;
esac
fi

### argument
Subcommand=$1
lang=$2
provider=$3
local=$4

if [ -z ${Subcommand} ];
then
echo "Subcommand is not be found."
node node_modules/.bin/cdktf help
exit 1
fi 

if [ ${Subcommand} == "init" ];
then
echo "Subcommand is ${Subcommand}"
else
echo "Subcommand is ${Subcommand}. This script focus on only \"init\""
exit 1
fi


if [ ! -d infra ];
then
echo "We will make directory \"infra\""
mkdir infra
fi
cd infra
#example --template=typescript --providers=aws --local
echo "Language is ${lang}. \"providers\" is ${provider}. ${local} is selected. "
echo "If errors happen, please set second argument \"--help\"" 
node ../node_modules/.bin/cdktf ${Subcommand} --template=${lang} --providers=${provider} --${local}