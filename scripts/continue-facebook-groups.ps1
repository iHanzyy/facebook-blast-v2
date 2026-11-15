param(
  [int]$PreviousProcessId = 17300,
  [int]$TargetNewGroups = 200,
  [int]$DelaySeconds = 30,
  [string]$Session = "facebook-groups-1fca3070af78"
)

$ErrorActionPreference = "Stop"
$candidatePath = Join-Path $PSScriptRoot "..\data\group-candidates.json"
$runnerPath = Join-Path $PSScriptRoot "join-facebook-groups.ps1"

$previous = Get-Process -Id $PreviousProcessId -ErrorAction SilentlyContinue
if ($previous) {
  $previous.WaitForExit()
  if ($previous.ExitCode -eq 2) {
    exit 2
  }
}

$candidateData = Get-Content -LiteralPath $candidatePath -Raw | ConvertFrom-Json

foreach ($candidate in @($candidateData.groups | Where-Object status -eq "failed")) {
  $candidate.status = "candidate"
  $candidate.notes = "retrying previously unverified join"
}

$additions = @(
  [pscustomobject]@{
    id = "2099524076951772"
    name = "Jual Beli HP Second/Baru Sekitar Kota Bogor Terbesar"
    url = "https://www.facebook.com/groups/2099524076951772"
    category = "iphone"
    priority = "bogor"
    status = "candidate"
    sourceQuery = "jual beli hp bogor"
    notes = ""
  },
  [pscustomobject]@{
    id = "1521811324791492"
    name = "Jual beli hp second Ciapus BNR Pancasan Ciomas Gunung Batu Bogor"
    url = "https://www.facebook.com/groups/1521811324791492"
    category = "iphone"
    priority = "bogor"
    status = "candidate"
    sourceQuery = "jual beli hp bogor"
    notes = ""
  },
  [pscustomobject]@{
    id = "401536120256240"
    name = "Jual beli Hp Citeureup Cibinong Bogor sekitarnya"
    url = "https://www.facebook.com/groups/401536120256240"
    category = "iphone"
    priority = "bogor"
    status = "candidate"
    sourceQuery = "jual beli hp citeureup"
    notes = ""
  }
)

foreach ($addition in $additions) {
  if ($candidateData.groups.id -notcontains $addition.id) {
    $candidateData.groups += $addition
  }
}

$candidateData | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $candidatePath -Encoding utf8

& $runnerPath -TargetNewGroups $TargetNewGroups -DelaySeconds $DelaySeconds -Session $Session
exit $LASTEXITCODE
