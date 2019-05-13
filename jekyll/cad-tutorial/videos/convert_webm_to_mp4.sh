#!/bin/bash

for f in `find . -name "*.webm"`
do
  echo "Processing $f file and checking for..."
  echo ${f/.webm/.mp4}
  if [ -f ${f/.webm/.mp4} ]; then
    echo "Already have mp4 for this file.  Use ./delete_mp4 script."
   continue
  fi
  ffmpeg -i $f -vcodec libx264 -vprofile baseline -b:v 350k -y ${f/.webm/.mp4}
done
