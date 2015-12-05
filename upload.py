#!/usr/bin/env python3
import argparse
import subprocess
import mimetypes

mimetypes.add_type('text/cloudlog', '.clg')

parser = argparse.ArgumentParser(description='upload the contents of a directory to a server')
parser.add_argument('directory', default='.', nargs='?', type=str, help='the directory from which to upload')
parser.add_argument('url', type=str, help='the base URL to export to')

args = parser.parse_args()

files = subprocess.check_output('find %s -type f' % args.directory, shell=True).decode('utf-8').split('\n')
pairs = [(file, file[len(args.directory):]) for file in files if file]

for (file, path) in pairs:
    contentType = mimetypes.guess_type(path)[0]
    subprocess.check_call('curl -X PUT -d @%s -H "Content-Type: %s" %s%s' %(file, contentType, args.url, path), shell=True)
