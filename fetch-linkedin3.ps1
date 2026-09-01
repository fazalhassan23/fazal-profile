$li_at = "YOUR_LI_AT_COOKIE_HERE"
$userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$cookie = New-Object System.Net.Cookie
$cookie.Name = "li_at"
$cookie.Value = $li_at
$cookie.Domain = ".linkedin.com"
$session.Cookies.Add($cookie)

Write-Output "Step 1: Getting JSESSIONID..."
$initResponse = Invoke-WebRequest -Uri "https://www.linkedin.com/feed/" -WebSession $session -UserAgent $userAgent -UseBasicParsing
$jsessionid = ($session.Cookies.GetCookies((New-Object System.Uri("https://www.linkedin.com"))) | Where-Object Name -eq "JSESSIONID").Value.Trim('"')

$headers = @{
    "Csrf-Token" = $jsessionid
    "X-Restli-Protocol-Version" = "2.0.0"
    "Accept" = "application/vnd.linkedin.normalized+json+2.1"
}

Write-Output "Step 2: Getting My Profile URN..."
$meUrl = "https://www.linkedin.com/voyager/api/me"
$meResponse = Invoke-RestMethod -Uri $meUrl -WebSession $session -Headers $headers -UserAgent $userAgent -Method Get
$publicIdentifier = $meResponse.miniProfile.publicIdentifier
Write-Output "Public Identifier: $publicIdentifier"

Write-Output "Step 3: Fetching recommendations..."
$url = "https://www.linkedin.com/voyager/api/identity/profiles/$publicIdentifier/recommendationsReceived?count=100"
$response = Invoke-RestMethod -Uri $url -WebSession $session -Headers $headers -UserAgent $userAgent -Method Get

$dataPath = "C:\Users\fazal\.gemini\antigravity\scratch\Fazal-portfolio\data\portfolio-data.json"
$jsonContent = Get-Content -Path $dataPath -Raw | ConvertFrom-Json

if ($null -eq $jsonContent.recommendations) {
    $jsonContent | Add-Member -NotePropertyName recommendations -NotePropertyValue @()
}
if ($jsonContent.recommendations -isnot [array]) {
    $jsonContent.recommendations = @($jsonContent.recommendations)
}

$newCount = 0
foreach ($el in $response.elements) {
    $recommender = $el.recommender
    $author = "$($recommender.firstName) $($recommender.lastName)".Trim()
    $text = $el.text
    
    if (-not $author -or -not $text) { continue }
    
    $exists = $false
    foreach ($existing in $jsonContent.recommendations) {
        if ($existing.author.ToLower() -eq $author.ToLower()) {
            $exists = $true
            break
        }
    }
    if ($exists) { continue }
    
    $avatarUrl = ""
    if ($recommender.picture -and $recommender.picture.rootUrl) {
        $avatarUrl = $recommender.picture.rootUrl
    }
    
    $dateStr = ""
    if ($el.created) {
        $epoch = [datetime]"1970-01-01T00:00:00Z"
        $dateStr = $epoch.AddMilliseconds($el.created).ToString("MMMM yyyy")
    }
    
    $recObj = [PSCustomObject]@{
        id = "rec-$(Get-Date -UFormat %s)-$(Get-Random -Maximum 9999)"
        author = $author
        firstName = $recommender.firstName
        lastName = $recommender.lastName
        headline = $recommender.occupation
        company = ""
        avatar = $avatarUrl
        linkedinUrl = "https://linkedin.com/in/$($recommender.publicIdentifier)"
        relationship = if ($el.relationship) { $el.relationship } else { "LinkedIn colleague" }
        date = $dateStr
        text = $text
        featured = $false
        visible = $true
    }
    
    $jsonContent.recommendations += $recObj
    $newCount++
}

$jsonContent | ConvertTo-Json -Depth 10 | Set-Content -Path $dataPath -Encoding UTF8
Write-Output "Success! Imported $newCount new recommendations."
