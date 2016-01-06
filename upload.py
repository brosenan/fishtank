#!/usr/bin/env python3
import argparse
import subprocess
import mimetypes
import os

uploadIndicatorFile = '.uploaded'

mimetypes.add_type('text/cloudlog', '.clg')
mimetypes.add_type('application/cedalion', '.cedimg')

parser = argparse.ArgumentParser(description='upload the contents of a directory to a server')
parser.add_argument('directory', default='.', nargs='?', type=str, help='the directory from which to upload')
parser.add_argument('url', type=str, help='the base URL to export to')

args = parser.parse_args()

try:
    lastUploadTime = os.stat(uploadIndicatorFile).st_mtime
except(FileNotFoundError):
    lastUploadTime = 0;

files = subprocess.check_output('find %s -type f' % args.directory, shell=True).decode('utf-8').split('\n')
pairs = [(file, file[len(args.directory):]) for file in files if file and os.stat(file).st_mtime > lastUploadTime]

for (file, path) in pairs:
    contentType = mimetypes.guess_type(path)[0]
    subprocess.check_call('curl -X PUT --data-binary @%s -H "Content-Type: %s" %s%s' %(file, contentType, args.url, path), shell=True)

subprocess.check_call(['touch', uploadIndicatorFile])
