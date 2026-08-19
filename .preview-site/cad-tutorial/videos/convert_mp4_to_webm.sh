#!/bin/bash

for f in `find . -name "*.mp4"`
do
  echo "Processing $f file and checking for..."
  echo ${f/.mp4/.webm}
  if [ -f ${f/.mp4/.webm} ]; then
    echo "Already have webm for this file.  Use ./delete_mp4 script."
   continue
  fi
  ffmpeg -i $f -acodec libvorbis -aq 5 -ac 2 -threads 2 ${f/.mp4/.webm}
done
