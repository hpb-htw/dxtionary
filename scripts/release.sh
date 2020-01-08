#!/usr/bin/env bash

# !!!!!!!!!!!!!!!!!! work for me only !!!!!!!!!!!!!!!!!!!!!

echo 'TODO: write itergration test before public'
vsce package
vsce publish -p $(cat ../htwsaar-token.txt)
echo '   --- Korrigiere ---'
echo 'might take a few MINUTES for it to show up.'
echo '-----------------^'