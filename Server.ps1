$port = 8080
$webRoot = "$PSScriptRoot"  # Root directory for serving files

# Ensure the data directory exists for JSON storage
$dataDir = "$PSScriptRoot\data"
if (!(Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}

# Start the HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "PowerShell HTTP Server started on http://localhost:$port/"

# Function to get MIME type based on file extension
function Get-MimeType($file) {
    switch -Regex ($file) {
        "\.html$" { "text/html" }
        "\.css$" { "text/css" }
        "\.js$" { "application/javascript" }
        "\.json$" { "application/json" }
        "\.png$" { "image/png" }
        "\.jpg$" { "image/jpeg" }
        "\.gif$" { "image/gif" }
        default { "application/octet-stream" }
    }
}

while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $path = $request.Url.LocalPath.TrimStart("/")

    # Handle root path redirection to index.html
    if ($path -eq "") {
        $redirectUrl = "http://localhost:$port/index.html"
        $response.Headers.Set("Location", $redirectUrl)
        $response.StatusCode = 302  # Temporary redirect
        $response.OutputStream.Close()
        continue
    }

    $filePath = Join-Path $webRoot $path

    # Check if request is for static files
    if ($request.HttpMethod -eq "GET" -and (Test-Path $filePath)) {
        try {
            $mimeType = Get-MimeType $filePath
            $response.ContentType = $mimeType
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.OutputStream.Write($content, 0, $content.Length)
        } catch {
            $redirectUrl = "http://localhost:$port/index.html"
            $response.Headers.Set("Location", $redirectUrl)
            $response.StatusCode = 302  # Temporary redirect
            $response.OutputStream.Close()
            continue
        }
    }

    # API: Save JSON Data for InputFrame
    elseif ($request.HttpMethod -eq "POST" -and $path -eq "api/save-data-InputFrame") {
        $reader = New-Object System.IO.StreamReader($request.InputStream)
        $jsonData = $reader.ReadToEnd()
        $reader.Close()
        $data = ConvertFrom-Json $jsonData
        $filePath = "$dataDir\InputFrame.json"
        $jsonData | Set-Content -Path $filePath -Encoding utf8
        Write-Host "Saved data to $filePath"
        $response.StatusCode = 200
        [System.Text.Encoding]::UTF8.GetBytes("{'status': 'success'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
    }

    # API: Save JSON Data for OutputFrame
    elseif ($request.HttpMethod -eq "POST" -and $path -eq "api/save-data-OutputFrame") {
        $reader = New-Object System.IO.StreamReader($request.InputStream)
        $jsonData = $reader.ReadToEnd()
        $reader.Close()
        $data = ConvertFrom-Json $jsonData
        $filePath = "$dataDir\OutputFrame.json"
        $jsonData | Set-Content -Path $filePath -Encoding utf8
        Write-Host "Saved data to $filePath"
        $response.StatusCode = 200
        [System.Text.Encoding]::UTF8.GetBytes("{'status': 'success'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
    }

    # API: Save JSON Data for VlookupManager
    elseif ($request.HttpMethod -eq "POST" -and $path -eq "api/save-data-VlookupManager") {
    # Read the incoming JSON data
    $reader = New-Object System.IO.StreamReader($request.InputStream)
    $jsonData = $reader.ReadToEnd()
    $reader.Close()

    # Parse the incoming JSON data
    $newData = ConvertFrom-Json $jsonData

    # Define the file path for VlookupManager.json
    $filePath = "$dataDir\VlookupManager.json"

    # Load existing data from the file (if it exists)
    if (Test-Path $filePath) {
        $existingDataJson = Get-Content -Path $filePath -Raw
        $existingData = ConvertFrom-Json $existingDataJson
    } else {
        $existingData = @{}
    }

    # Merge existing data with the new data
    $mergedData = @{}
    foreach ($key in $existingData.PSObject.Properties.Name) {
        if ($existingData.$key.headers -and $existingData.$key.rows) {
            $mergedData[$key] = @{
                headers = $existingData.$key.headers
                rows = $existingData.$key.rows
            }
        }
    }
    foreach ($key in $newData.PSObject.Properties.Name) {
        if ($newData.$key.headers -and $newData.$key.rows) {
            $mergedData[$key] = @{
                headers = $newData.$key.headers
                rows = $newData.$key.rows
            }
        }
    }

    # Save the merged data back to the file
    $mergedDataJson = ConvertTo-Json $mergedData
    Set-Content -Path $filePath -Value $mergedDataJson -Encoding utf8

    Write-Host "Saved updated VLOOKUP data to $filePath"

    # Respond with success status
    $response.StatusCode = 200
    [System.Text.Encoding]::UTF8.GetBytes("{'status': 'success'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
    }

    # API: Load JSON Data for VlookupManager
    elseif ($request.HttpMethod -eq "GET" -and $path -eq "api/load-data-VlookupManager") {
        # Define the file path for VlookupManager.json
        $filePath = "$dataDir\VlookupManager.json"

        # Check if the file exists
        if (Test-Path $filePath) {
            $dataJson = Get-Content -Path $filePath -Raw
            $data = ConvertFrom-Json $dataJson

            # Extract only the headers and rows for each key
            $cleanData = @{}
            foreach ($key in $data.PSObject.Properties.Name) {
                if ($data.$key.headers -and $data.$key.rows) {
                    $cleanData[$key] = @{
                        headers = $data.$key.headers
                        rows = $data.$key.rows
                    }
                }
            }

            # Respond with the cleaned data
            $response.StatusCode = 200
            $responseData = ConvertTo-Json $cleanData
            [System.Text.Encoding]::UTF8.GetBytes($responseData) | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } else {
            # Respond with an empty object if the file doesn't exist
            $response.StatusCode = 200
            $responseData = "{}"
            [System.Text.Encoding]::UTF8.GetBytes($responseData) | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
    }

    # API: Load InputFrame.json
    elseif ($request.HttpMethod -eq "GET" -and $path -eq "api/load-inputframe") {
        $filePath = "$dataDir\InputFrame.json"
        if (Test-Path $filePath) {
            $jsonContent = Get-Content -Path $filePath -Raw
            $response.ContentType = "application/json"
            [System.Text.Encoding]::UTF8.GetBytes($jsonContent) | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } else {
            $response.StatusCode = 404
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': 'File not found'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
    }

    # API: Load OutputFrame.json
    elseif ($request.HttpMethod -eq "GET" -and $path -eq "api/load-outputframe") {
        $filePath = "$dataDir\OutputFrame.json"
        if (Test-Path $filePath) {
            $jsonContent = Get-Content -Path $filePath -Raw
            $response.ContentType = "application/json"
            [System.Text.Encoding]::UTF8.GetBytes($jsonContent) | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } else {
            $response.StatusCode = 404
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': 'File not found'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
    }

    # API: Load JSON Data
    elseif ($request.HttpMethod -eq "GET" -and $path -match "api/load/(.*)") {
        $fileName = $matches[1]
        $filePath = "$dataDir\$fileName.json"
        if (Test-Path $filePath) {
            $jsonContent = Get-Content -Path $filePath -Raw
            $response.ContentType = "application/json"
            [System.Text.Encoding]::UTF8.GetBytes($jsonContent) | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } else {
            $response.StatusCode = 404
            [System.Text.Encoding]::UTF8.GetBytes("[]") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
    }

    # Default fallback: Redirect to index.html
    else {
        $redirectUrl = "http://localhost:$port/index.html"
        $response.Headers.Set("Location", $redirectUrl)
        $response.StatusCode = 302  # Temporary redirect
        $response.OutputStream.Close()
        continue
    }

    $response.OutputStream.Close()
}