# Windows CI only: logs every start and exit of the E2E app with its exit code, so a death mid-test says how it died.
# The harness's own stop (Stop-Process) exits with 0xFFFFFFFF. A crash exits with an NTSTATUS such as 0xC0000374 (heap
# corruption), 0xC0000005 (access violation), 0xC000001D (illegal instruction) or 0xC0000409 (Rust abort / fail-fast).
# GitHub's Windows runners keep Windows Error Reporting stopped, so there is no event-log record or WER dump to read.
param([Parameter(Mandatory)][string]$Log)
# Keyed by PID and start time: an exited process can stay listed for a moment, and a PID can be reused.
$seen=@{};$done=[System.Collections.Generic.HashSet[string]]::new()
while($true){
 foreach($p in Get-Process opsanta -ErrorAction SilentlyContinue){
  try{$k='{0}:{1}' -f $p.Id,$p.StartTime.Ticks}catch{continue}
  if(-not $seen.ContainsKey($k) -and -not $done.Contains($k)){
   # Reading .Handle opens and keeps a handle, so ExitCode stays readable after the process is gone.
   try{$null=$p.Handle;$seen[$k]=$p;Add-Content $Log ("{0} start pid={1}" -f (Get-Date -Format o),$p.Id)}catch{}
  }
 }
 foreach($k in @($seen.Keys)){
  $p=$seen[$k]
  if($p.HasExited){
   $code=try{'0x{0:X8}' -f $p.ExitCode}catch{'unknown'}
   Add-Content $Log ("{0} exit  pid={1} code={2}" -f (Get-Date -Format o),$p.Id,$code)
   $seen.Remove($k);$null=$done.Add($k)
  }
 }
 Start-Sleep -Milliseconds 100
}
