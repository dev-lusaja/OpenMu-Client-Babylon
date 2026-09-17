#!/usr/bin/env bash

repomix --style xml \
  --output-show-line-numbers \
  --output "./.repomix/context.xml" \
  --split-output=1mb \
  --ignore "**/*.txt,**/*.xml,**/*.png,**/*.env,**/node_modules/**,**/.repomix/**,**/Data-v097d/**,**/Data/**,**/*.json,public/game-assets-v097d/**,public/game-assets/**,src/i18n/**,public/js/draco_decoder_gltf.js"