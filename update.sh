#!/bin/bash

cd "$(dirname "$0")"
node update
echo `date` > lastrun
