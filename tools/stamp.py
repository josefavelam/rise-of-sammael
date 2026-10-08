#!/usr/bin/env python3
# Run before every push: syntax-checks js/*.js and rewrites the ?v= stamp of every local
# script and stylesheet in index.html to the first 8 hex of the file's SHA-256, so browsers
# never run a stale file. Prints the files whose stamp changed.
import re,hashlib,subprocess,sys,glob,os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
bad=0
for f in sorted(glob.glob('js/*.js')):
    r=subprocess.run(['node','--check',f],capture_output=True,text=True)
    if r.returncode: bad+=1;print('SYNTAX ERROR',f,r.stderr.strip()[:400])
if bad: sys.exit(1)
s=open('index.html',encoding='utf-8').read();changed=[]
def sub(m):
    path=m.group(2)
    h=hashlib.sha256(open(path,'rb').read()).hexdigest()[:8]
    if m.group(3)!=h: changed.append(path)
    return m.group(1)+path+'?v='+h
s2=re.sub(r'((?:src|href)=")((?:js|css)/[^"?]+)\?v=([0-9a-f]+)',sub,s)
if s2!=s: open('index.html','w',encoding='utf-8').write(s2)
print('js ok;','stamps changed:',', '.join(changed) or 'none')
