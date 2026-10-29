// Standard-library-only, loopback-only launcher for the extracted presentation.
package main

import (
 "crypto/sha256"
 "encoding/hex"
 "encoding/json"
 "flag"
 "fmt"
 "log"
 "mime"
 "net"
 "net/http"
 "os"
 "os/exec"
 "path/filepath"
 "runtime"
 "time"
)
type fileEntry struct { Path string `json:"path"`; SHA256 string `json:"sha256"` }
func main() {
 rootFlag:=flag.String("root","","extracted package directory")
 port:=flag.Int("port",8878,"loopback port; automatically picks a free port if occupied")
 noOpen:=flag.Bool("no-open",false,"do not launch the default browser")
 flag.Parse()
 root:=*rootFlag
 if root=="" {exe,err:=os.Executable();if err!=nil {log.Fatal(err)};root=filepath.Dir(exe)}
 root,err:=filepath.Abs(root);if err!=nil {log.Fatal(err)}
 body,err:=os.ReadFile(filepath.Join(root,"runtime-manifest.json"));if err!=nil {log.Fatal("Extract the entire ZIP first: ",err)}
 var manifest struct {Files []fileEntry `json:"files"`};if err=json.Unmarshal(body,&manifest);err!=nil {log.Fatal(err)}
 for _,entry:=range manifest.Files {data,err:=os.ReadFile(filepath.Join(root,filepath.FromSlash(entry.Path)));if err!=nil {log.Fatal(err)};sum:=sha256.Sum256(data);if hex.EncodeToString(sum[:])!=entry.SHA256 {log.Fatal("File verification failed: ",entry.Path)}}
 for ext,kind:=range map[string]string{".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".wasm":"application/wasm",".woff2":"font/woff2",".woff":"font/woff",".glb":"model/gltf-binary",".gltf":"model/gltf+json",".gz":"application/gzip",".bin":"application/octet-stream"} {_=mime.AddExtensionType(ext,kind)}
 listener,err:=net.Listen("tcp",fmt.Sprintf("127.0.0.1:%d",*port));if err!=nil {listener,err=net.Listen("tcp","127.0.0.1:0")};if err!=nil {log.Fatal(err)}
 address:="http://"+listener.Addr().String()
 mux:=http.NewServeMux();files:=http.FileServer(http.Dir(root))
 mux.HandleFunc("/",func(w http.ResponseWriter,r *http.Request){w.Header().Set("Cache-Control","no-cache");if r.URL.Path=="/" {http.Redirect(w,r,"/examples/pioneer-draft/index.html",http.StatusTemporaryRedirect);return};files.ServeHTTP(w,r)})
 fmt.Printf("Pioneer presentation — %d runtime files verified.\n%s/examples/pioneer-draft/index.html\nKeep this window open. Press Ctrl+C to stop.\n",len(manifest.Files),address)
 if !*noOpen {go func(){time.Sleep(250*time.Millisecond);var cmd *exec.Cmd;switch runtime.GOOS {case "windows":cmd=exec.Command("rundll32","url.dll,FileProtocolHandler",address);case "darwin":cmd=exec.Command("open",address);default:cmd=exec.Command("xdg-open",address)};if err:=cmd.Start();err!=nil {fmt.Println("Open the URL above in Chrome or Edge.")}}()}
 server:=http.Server{Handler:mux,ReadHeaderTimeout:10*time.Second,IdleTimeout:60*time.Second}
 log.Fatal(server.Serve(listener))
}
