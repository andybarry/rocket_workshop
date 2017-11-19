#!/bin/bash

for f in `find ./ -name "*.mp4"`
do
  echo "Deleting all mp4 files in subdirectories"
  rm $f
done
