$li_at = "YOUR_LI_AT_COOKIE_HERE"
$csrfToken = "ajax:12345678901234567"
$cookie = "li_at=$li_at; JSESSIONID=`"$csrfToken`";"

$headers = @{
    "Cookie" = $cookie
    "Csrf-Token" = $csrfToken
    "X-Restli-Protocol-Version" = "2.0.0"
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

$url = "https://www.linkedin.com/voyager/api/identity/profiles/fazalmahmudhassan/recommendationsReceived?count=100"

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    
    $dataPath = "C:\Users\fazal\.gemini\antigravity\scratch\Fazal-portfolio\data\portfolio-data.json"
    $jsonContent = Get-Content -Path $dataPath -Raw | ConvertFrom-Json
    
    if ($null -eq $jsonContent.recommendations) {
        $jsonContent | Add-Member -NotePropertyName recommendations -NotePropertyValue @()
    }
    
    # PowerShell ConvertFrom-Json creates an array if multiple, but single object if only one.
    # Force recommendations to be an array if it's not already
    if ($jsonContent.recommendations -isnot [array]) {
        $jsonContent.recommendations = @($jsonContent.recommendations)
    }

    $newCount = 0
    
    foreach ($el in $response.elements) {
        $recommender = $el.recommender
        $author = "$($recommender.firstName) $($recommender.lastName)".Trim()
        $text = $el.text
        $headline = $recommender.occupation
        $relationship = $el.relationship
        if (-not $relationship) { $relationship = "LinkedIn colleague" }
        
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
        
        $linkedinUrl = ""
        if ($recommender.publicIdentifier) {
            $linkedinUrl = "https://linkedin.com/in/$($recommender.publicIdentifier)"
        }
        
        $dateStr = ""
        if ($el.created) {
            $epoch = [datetime]"1970-01-01T00:00:00Z"
            $dateObj = $epoch.AddMilliseconds($el.created)
            $dateStr = $dateObj.ToString("MMMM yyyy")
        }
        
        $recObj = [PSCustomObject]@{
            id = "rec-$(Get-Date -UFormat %s)-$(Get-Random -Maximum 9999)"
            author = $author
            firstName = $recommender.firstName
            lastName = $recommender.lastName
            headline = $headline
            company = ""
            avatar = $avatarUrl
            linkedinUrl = $linkedinUrl
            relationship = $relationship
            date = $dateStr
            text = $text
            featured = $false
            visible = $true
        }
        
        $jsonContent.recommendations += $recObj
        $newCount++
    }
    
    $jsonContent | ConvertTo-Json -Depth 10 | Set-Content -Path $dataPath -Encoding UTF8
    Write-Output "Successfully imported $newCount new recommendations from LinkedIn!"
} catch {
    Write-Output "Error details: $($_.Exception.Message)"
}
