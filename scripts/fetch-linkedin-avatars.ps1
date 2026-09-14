<#
.SYNOPSIS
    fetch-linkedin-avatars.ps1
    Automated PowerShell script to fetch LinkedIn recommendations and display photos via Voyager API.
    Downloads photos locally to assets/testimonials/ and updates data/portfolio-data.json.
#>

param(
    [string]$LiAt = $env:LINKEDIN_LI_AT,
    [switch]$DryRun
)

$baseDir = Split-Path -Parent $PSScriptRoot
$dataPath = Join-Path $baseDir "data\portfolio-data.json"
$avatarsDir = Join-Path $baseDir "assets\testimonials"

if (-not $LiAt) {
    try {
        $clip = (Get-Clipboard | Out-String).Trim()
        if ($clip -and $clip.Length -gt 20) {
            Write-Host "Detected 'li_at' cookie from clipboard." -ForegroundColor Green
            $LiAt = $clip
        }
    } catch {}
}

if (-not $LiAt) {
    Write-Host "Please enter your LinkedIn 'li_at' cookie value:" -ForegroundColor Yellow
    Write-Host "(In Chrome/Edge: Open linkedin.com -> F12 -> Application -> Cookies -> li_at)" -ForegroundColor Gray
    $LiAt = Read-Host "li_at"
}

if (-not $LiAt) {
    Write-Host "Error: No 'li_at' cookie provided. Aborting." -ForegroundColor Red
    exit 1
}

$userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$cookie = New-Object System.Net.Cookie("li_at", $LiAt, "/", ".linkedin.com")
$session.Cookies.Add($cookie)

Write-Host "`nStep 1: Connecting to LinkedIn and retrieving JSESSIONID..." -ForegroundColor Cyan
try {
    $null = Invoke-WebRequest -Uri "https://www.linkedin.com/feed/" -WebSession $session -UserAgent $userAgent -UseBasicParsing -TimeoutSec 15
} catch {
    Write-Host "Note: Feed init returned notice, continuing..." -ForegroundColor Gray
}

$jsessionid = ($session.Cookies.GetCookies((New-Object System.Uri("https://www.linkedin.com"))) | Where-Object Name -eq "JSESSIONID").Value.Trim('"')
if (-not $jsessionid) {
    $jsessionid = "ajax:12345678901234567"
}
Write-Host "JSESSIONID verified." -ForegroundColor Green

$headers = @{
    "Csrf-Token" = $jsessionid
    "X-Restli-Protocol-Version" = "2.0.0"
    "Accept" = "application/vnd.linkedin.normalized+json+2.1"
}

Write-Host "`nStep 2: Resolving profile identity..." -ForegroundColor Cyan
$publicId = "fazalmahmudhassan"
try {
    $me = Invoke-RestMethod -Uri "https://www.linkedin.com/voyager/api/me" -WebSession $session -Headers $headers -UserAgent $userAgent -Method Get -TimeoutSec 15
    if ($me.miniProfile -and $me.miniProfile.publicIdentifier) {
        $publicId = $me.miniProfile.publicIdentifier
    }
} catch {
    Write-Host "Using default profile vanity: $publicId" -ForegroundColor Gray
}
Write-Host "Profile identifier: $publicId" -ForegroundColor Green

Write-Host "`nStep 3: Fetching recommendations..." -ForegroundColor Cyan
$recUrl = "https://www.linkedin.com/voyager/api/identity/profiles/$publicId/recommendationsReceived?count=100"

try {
    $response = Invoke-RestMethod -Uri $recUrl -WebSession $session -Headers $headers -UserAgent $userAgent -Method Get -TimeoutSec 20
} catch {
    Write-Host "Error calling LinkedIn Voyager API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check if your 'li_at' cookie is still valid and not expired." -ForegroundColor Yellow
    exit 1
}

$elements = $response.elements
$included = $response.included
Write-Host "Successfully fetched $($elements.Count) recommendations from LinkedIn." -ForegroundColor Green

if (-not (Test-Path $avatarsDir)) {
    New-Item -ItemType Directory -Path $avatarsDir -Force | Out-Null
}

$jsonContent = Get-Content -Path $dataPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($null -eq $jsonContent.recommendations) {
    $jsonContent | Add-Member -NotePropertyName recommendations -NotePropertyValue @()
}
if ($jsonContent.recommendations -isnot [array]) {
    $jsonContent.recommendations = @($jsonContent.recommendations)
}

# Index MiniProfiles from included entity collection
$miniProfiles = @{}
foreach ($inc in $included) {
    if ($inc.'$type' -like "*MiniProfile*" -or $inc.entityUrn -like "*miniProfile*") {
        $miniProfiles[$inc.entityUrn] = $inc
    }
}

Write-Host "`nStep 4: Downloading display pictures..." -ForegroundColor Cyan
$downloaded = 0
$updated = 0

foreach ($el in $elements) {
    $recommender = $el.recommender
    if ($recommender -is [string] -and $miniProfiles.ContainsKey($recommender)) {
        $recommender = $miniProfiles[$recommender]
    }

    $firstName = ($recommender.firstName).Trim()
    $lastName = ($recommender.lastName).Trim()
    $author = "$firstName $lastName".Trim()
    $text = $el.text
    $publicIdentifier = $recommender.publicIdentifier
    $headline = $recommender.occupation

    if (-not $author -or -not $text) { continue }

    # Extract high-res image URL from VectorImage
    $pictureUrl = ""
    $picObj = $recommender.picture
    if ($picObj -and $picObj.'com.linkedin.common.VectorImage') {
        $picObj = $picObj.'com.linkedin.common.VectorImage'
    }

    if ($picObj -and $picObj.rootUrl -and $picObj.artifacts) {
        $bestArtifact = $picObj.artifacts | Sort-Object width -Descending | Select-Object -First 1
        $pictureUrl = $picObj.rootUrl + $bestArtifact.fileIdentifyingUrlPathSegment
    }

    # Clean filename slug
    $cleanName = ($author -split '[,|(\[]')[0].Trim() -replace '[^a-zA-Z0-9\s-]', '' -replace '[\s_]+', '-'
    $slug = $cleanName.ToLower()
    $localRelPath = ""

    if ($pictureUrl) {
        $localFileName = "$slug.jpg"
        $localFilePath = Join-Path $avatarsDir $localFileName
        $localRelPath = "assets/testimonials/$localFileName"

        Write-Host " -> Found photo for $author" -ForegroundColor Gray
        if (-not $DryRun) {
            try {
                Invoke-WebRequest -Uri $pictureUrl -OutFile $localFilePath -UserAgent $userAgent -TimeoutSec 15
                $downloaded++
                Write-Host "    Saved: $localRelPath" -ForegroundColor DarkGreen
            } catch {
                Write-Host "    Failed to download photo: $($_.Exception.Message)" -ForegroundColor DarkYellow
            }
        } else {
            Write-Host "    [Dry Run] Would save to $localRelPath" -ForegroundColor DarkGray
        }
    }

    # Match in portfolio-data.json
    $matched = $null
    foreach ($r in $jsonContent.recommendations) {
        if ($r.author.Trim().ToLower() -eq $author.ToLower() -or $r.author.ToLower().Contains($author.ToLower())) {
            $matched = $r
            break
        }
    }

    $linkedinUrl = if ($publicIdentifier) { "https://linkedin.com/in/$publicIdentifier" } else { "" }

    if ($matched) {
        if ($localRelPath) { $matched.avatar = $localRelPath }
        if ($linkedinUrl -and -not $matched.linkedinUrl) { $matched.linkedinUrl = $linkedinUrl }
        if ($headline -and -not $matched.headline) { $matched.headline = $headline }
        $updated++
    } else {
        $dateStr = ""
        if ($el.created) {
            $epoch = [datetime]"1970-01-01T00:00:00Z"
            $dateStr = $epoch.AddMilliseconds($el.created).ToString("MMMM yyyy")
        }
        $newObj = [PSCustomObject]@{
            id = "rec-$slug"
            author = $author
            firstName = $firstName
            lastName = $lastName
            headline = $headline
            company = ""
            avatar = $localRelPath
            linkedinUrl = $linkedinUrl
            relationship = if ($el.relationship) { $el.relationship } else { "LinkedIn recommendation received" }
            date = $dateStr
            text = $text
            featured = $false
            visible = $true
        }
        $jsonContent.recommendations += $newObj
        $updated++
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host " - Recommendations processed: $updated" -ForegroundColor White
Write-Host " - Display pictures downloaded: $downloaded" -ForegroundColor White

if (-not $DryRun) {
    $jsonContent | ConvertTo-Json -Depth 10 | Set-Content -Path $dataPath -Encoding UTF8
    Write-Host " Successfully updated $dataPath!" -ForegroundColor Green
} else {
    Write-Host " [Dry Run] No files were modified." -ForegroundColor Yellow
}
