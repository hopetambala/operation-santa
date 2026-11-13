# Windows E2E only: logs every start and exit of the E2E app, with its exit code, so a death mid-test says how it died.
# The harness's own kill (Stop-Process) exits with 0xFFFFFFFF; a crash exits with an NTSTATUS such as 0xC0000374 (heap
# corruption), 0xC0000005 (access violation), 0xC00000FD (stack overflow) or 0xC0000409 (Rust abort / fail-fast).
param([Parameter(Mandatory)][string]$Log)
$seen=@{}
while($true){
 foreach($p in Get-Process opsanta -ErrorAction SilentlyContinue){
  if(-not $seen.ContainsKey($p.Id)){
   # Reading .Handle opens and keeps a handle, so ExitCode stays readable after the process is gone.
   try{$null=$p.Handle;$seen[$p.Id]=$p;Add-Content $Log ("{0} start pid={1}" -f (Get-Date -Format o),$p.Id)}catch{}
  }
 }
 foreach($id in @($seen.Keys)){
  $p=$seen[$id]
  if($p.HasExited){Add-Content $Log ("{0} exit  pid={1} code=0x{2:X8}" -f (Get-Date -Format o),$id,$p.ExitCode);$seen.Remove($id)}
 }
 Start-Sleep -Milliseconds 100
}
