param(
  [int]$TargetNewGroups = 200,
  [int]$DelaySeconds = 30,
  [string]$Session = "facebook-groups-1fca3070af78"
)

$ErrorActionPreference = "Stop"
$candidatePath = Join-Path $PSScriptRoot "..\data\group-candidates.json"
$groupPath = Join-Path $PSScriptRoot "..\data\groups.json"

function Invoke-AgentBrowser {
  param([string[]]$Arguments)
  & agent-browser --session $Session @Arguments 2>$null
}

function Get-Snapshot {
  return (Invoke-AgentBrowser @("snapshot", "-i", "-c")) -join [Environment]::NewLine
}

function Get-CurrentUrl {
  return ((Invoke-AgentBrowser @("get", "url")) -join "").Trim()
}

function Save-Progress {
  $script:candidateData | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $candidatePath -Encoding utf8
  $script:groupData | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $groupPath -Encoding utf8
}

function Set-CandidateStatus {
  param(
    [object]$Candidate,
    [string]$Status,
    [string]$Note = ""
  )
  $Candidate.status = $Status
  if ($Note) { $Candidate.notes = $Note }
}

function Add-ActiveGroup {
  param([object]$Candidate)
  if ($script:groupData.groups.id -contains $Candidate.id) { return }
  $script:groupData.groups += [pscustomobject]@{
    id = $Candidate.id
    name = $Candidate.name
    url = $Candidate.url
    enabled = $true
    notes = ""
    category = "iphone"
  }
}

function Get-VisibleDialogText {
  $javascript = "Array.from(document.querySelectorAll('[role=dialog]')).filter(d => d.getClientRects().length && getComputedStyle(d).visibility !== 'hidden').map(d => d.innerText).join('\\n').slice(0,2000)"
  $base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($javascript))
  $raw = (Invoke-AgentBrowser @("eval", "-b", $base64, "--json")) -join ""
  if (-not $raw) { return "" }
  return (($raw | ConvertFrom-Json).data.result ?? "")
}

function Test-SecurityStop {
  param(
    [string]$Url,
    [string]$Snapshot
  )
  return $Url -match "(?i)(checkpoint|login|recover|security)" -or
    $Snapshot -match "(?i)(captcha|security check|pemeriksaan keamanan|akun.*dibatasi|kami membatasi|coba lagi nanti|terlalu cepat|anda tidak dapat bergabung)"
}

function Click-HeaderJoinButton {
  param([string]$Snapshot)
  $match = [regex]::Match($Snapshot, 'button "Gabung ke grup" \[ref=(e\d+)\]')
  if (-not $match.Success) { return $false }
  $selector = "@" + $match.Groups[1].Value
  Invoke-AgentBrowser @("click", $selector) | Out-Null
  return $true
}

$candidateData = Get-Content -LiteralPath $candidatePath -Raw | ConvertFrom-Json
$groupData = Get-Content -LiteralPath $groupPath -Raw | ConvertFrom-Json
$orderedCandidates = @($candidateData.groups | Where-Object status -eq "candidate" | Sort-Object @{ Expression = { if ($_.priority -eq "bogor") { 0 } else { 1 } } })

$joinedCount = @($candidateData.groups | Where-Object status -eq "joined").Count
Write-Output "START|joined=$joinedCount|target=$TargetNewGroups|remainingCandidates=$($orderedCandidates.Count)"

foreach ($candidate in $orderedCandidates) {
  if ($joinedCount -ge $TargetNewGroups) { break }

  Write-Output "WAIT|$joinedCount|$($candidate.id)|$($candidate.name)"
  Invoke-AgentBrowser @("wait", "${DelaySeconds}000") | Out-Null
  Invoke-AgentBrowser @("open", $candidate.url) | Out-Null

  $url = Get-CurrentUrl
  $snapshot = Get-Snapshot
  if (Test-SecurityStop $url $snapshot) {
    Set-CandidateStatus $candidate "manual_action_required" "security or rate-limit page"
    Save-Progress
    Write-Output "STOP|security|$($candidate.id)|$($candidate.name)"
    exit 2
  }

  if ($snapshot -match 'button "Bergabung"') {
    Set-CandidateStatus $candidate "joined" "already joined when checked"
    Add-ActiveGroup $candidate
    $joinedCount++
    Save-Progress
    Write-Output "JOINED|$joinedCount|$($candidate.id)|$($candidate.name)"
    continue
  }

  if (-not (Click-HeaderJoinButton $snapshot)) {
    Set-CandidateStatus $candidate "failed" "header join button not found"
    Save-Progress
    Write-Output "SKIP|no-button|$($candidate.id)|$($candidate.name)"
    continue
  }

  Invoke-AgentBrowser @("wait", "3000") | Out-Null
  $url = Get-CurrentUrl
  $snapshot = Get-Snapshot
  $dialog = Get-VisibleDialogText

  if (Test-SecurityStop $url $snapshot) {
    Set-CandidateStatus $candidate "manual_action_required" "security or rate-limit page after join"
    Save-Progress
    Write-Output "STOP|security|$($candidate.id)|$($candidate.name)"
    exit 2
  }

  if ($dialog) {
    Set-CandidateStatus $candidate "manual_action_required" "membership questions require user input"
    Save-Progress
    Invoke-AgentBrowser @("press", "Escape") | Out-Null
    Write-Output "SKIP|questions|$($candidate.id)|$($candidate.name)"
    continue
  }

  if ($snapshot -match 'button "Bergabung"') {
    Set-CandidateStatus $candidate "joined"
    Add-ActiveGroup $candidate
    $joinedCount++
    Save-Progress
    Write-Output "JOINED|$joinedCount|$($candidate.id)|$($candidate.name)"
    continue
  }

  if ($snapshot -match "(?i)(batalkan permintaan|menunggu|pending)") {
    Set-CandidateStatus $candidate "requested" "waiting for administrator approval"
    Save-Progress
    Write-Output "REQUESTED|$joinedCount|$($candidate.id)|$($candidate.name)"
    continue
  }

  Set-CandidateStatus $candidate "failed" "join result could not be verified"
  Save-Progress
  Write-Output "SKIP|unverified|$($candidate.id)|$($candidate.name)"
}

$remaining = $TargetNewGroups - $joinedCount
Write-Output "DONE|joined=$joinedCount|target=$TargetNewGroups|remaining=$remaining"
if ($remaining -gt 0) { exit 3 }
