"""Build a source-verified portable presentation ZIP; never edits research data."""
from pathlib import Path
import hashlib,json,shutil,subprocess,os,sys,zipfile,concurrent.futures
root=Path(__file__).resolve().parents[2]
go=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
revision=subprocess.check_output(['git','rev-parse','--short=7','HEAD'],cwd=root,text=True).strip()
name=f'Pioneer-ICCAS2026-{revision}'
package=out/name
if package.exists():raise SystemExit(f'Already exists: {package}')
package.mkdir()
manifest=json.loads((root/'runtime-manifest.json').read_text())
for entry in manifest['files']:
 src=root/entry['path'];assert hashlib.sha256(src.read_bytes()).hexdigest()==entry['sha256']
 dst=package/entry['path'];dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
shutil.copy2(root/'runtime-manifest.json',package/'runtime-manifest.json')
shutil.copy2(root/'docs/english-speaker-script.md',package/'Speaker_Script.md')
shutil.copy2(root/'tools/offline/presentation.go',package/'Launcher_Source.go')
shutil.copy2(go.parent.parent/'LICENSE',package/'Go-LICENSE.txt')
shutil.copy2(go.parent.parent/'PATENTS',package/'Go-PATENTS.txt')
page=f'https://radon213.github.io/pioneer-presentation/examples/pioneer-draft/index.html?v={revision}'
repo='https://github.com/Radon213/pioneer-presentation'
(package/'Online_Presentation.url').write_text('[InternetShortcut]\nURL='+page+'\n')
(package/'GitHub_Repository.url').write_text('[InternetShortcut]\nURL='+repo+'\n')
(package/'README_KO.txt').write_text(f'''Pioneer · ICCAS 2026 발표용 오프라인 패키지
버전: {revision} / 전체 30단계 / 약 12분

1. ZIP 전체를 먼저 압축 해제하세요. 폴더 구조를 유지하세요.
2. Windows: Presentation-Windows.exe를 실행하세요.
   Ubuntu/Linux x64: Presentation-Linux를 실행하세요.
   터미널: ./Presentation-Linux
   실행 권한이 필요하면: chmod +x Presentation-Linux
3. 브라우저가 자동으로 열립니다. 실행 창은 발표가 끝날 때까지 유지하세요.
   Chrome/Edge를 권장합니다. HTML 파일을 직접 더블클릭하지 마세요.
4. 방향키/Space: 다음 단계, 왼쪽 방향키: 이전 단계.
   방향키를 길게 누르면 빠르게 이동합니다. F: 전체 화면. S: 발표자 모드.
5. 디스플레이를 '확장'으로 설정하세요.
   청중 화면은 프로젝터에, 발표자 화면은 본인 모니터에 놓으세요.
   발표자 모드에서 T: 타이머 시작/정지, R: 타이머 초기화.
6. 모델, 애니메이션, 폰트, 수식과 대본이 포함되어 인터넷 없이 동작합니다.
   온라인 바로가기와 논문 출처 링크를 여는 경우에는 인터넷이 필요합니다.
7. 종료: 실행 창에서 Ctrl+C.

온라인 발표: {page}
GitHub 저장소: {repo}
영어 대본: Speaker_Script.md 또는 발표자 모드(S)
검증: Ubuntu x64. Windows 실행 파일은 같은 소스를 크로스빌드했습니다.
''')
env={**os.environ,'CGO_ENABLED':'0','GOTOOLCHAIN':'local'}
def build(target):
 system,filename=target
 subprocess.run([str(go),'build','-trimpath','-ldflags=-s -w','-o',str(package/filename),str(root/'tools/offline/presentation.go')],env={**env,'GOOS':system,'GOARCH':'amd64'},check=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(build,[('linux','Presentation-Linux'),('windows','Presentation-Windows.exe')]))
(package/'Presentation-Linux').chmod(0o755)
meta={'revision':revision,'runtimeFiles':len(manifest['files']),'runtimeBytes':manifest['runtimeBytes'],'onlinePresentation':page,'repository':repo,'runtimeSelfContained':True,'launcherBind':'127.0.0.1 only','sourcePreserved':True}
(package/'OFFLINE_PACKAGE.json').write_text(json.dumps(meta,indent=2)+'\n')
lines=[]
for p in sorted(package.rglob('*')):
 if p.is_file():lines.append(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(package).as_posix())
(package/'SHA256SUMS.txt').write_text('\n'.join(lines)+'\n')
archive=out/(name+'.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(package.rglob('*')):
  if p.is_file():z.write(p,name+'/'+p.relative_to(package).as_posix())
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print(json.dumps({**meta,'zip':str(archive),'zipBytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()},indent=2))
