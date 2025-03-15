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

        # API: Save JSON Data for Mapping
    elseif ($request.HttpMethod -eq "POST" -and $path -eq "api/save-data-Mapping") {
        try {
            # Read the incoming JSON data from the request body
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $jsonData = $reader.ReadToEnd()
            $reader.Close()

            # Parse the JSON data
            $data = ConvertFrom-Json $jsonData

            # Define the file path for the Mapping JSON file
            $filePath = "$dataDir\Mapping.json"

            # Write the updated JSON data to the file
            $jsonData | Set-Content -Path $filePath -Encoding utf8

            Write-Host "Saved data to $filePath"

            # Respond with success status
            $response.StatusCode = 200
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'success'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } catch {
            # Log the error and respond with an error status
            $errorMessage = $_.Exception.Message
            Write-Host "Error saving Mapping data: $errorMessage"
            $response.StatusCode = 500
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': '$errorMessage'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
    }

    # API: Save JSON Data for Default Fields File
    elseif ($request.HttpMethod -eq "POST" -and $path -eq "api/save-data-DefaulFields") {
        try {
            # Read the incoming JSON data from the request body
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $jsonData = $reader.ReadToEnd()
            $reader.Close()

            # Parse the JSON data
            $data = ConvertFrom-Json $jsonData

            # Define the file path for the Default Fields JSON file
            $filePath = "$dataDir\DefaultFields.json"

            # Write the updated JSON data to the file
            $jsonData | Set-Content -Path $filePath -Encoding utf8

            Write-Host "Saved Default Fields data to $filePath"

            # Respond with success status
            $response.StatusCode = 200
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'success'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } catch {
            # Log the error and respond with an error status
            $errorMessage = $_.Exception.Message
            Write-Host "Error saving Default Fields data: $errorMessage"
            $response.StatusCode = 500
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': '$errorMessage'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
    }

    # API: Load JSON Data for Default Fields File
    elseif ($request.HttpMethod -eq "GET" -and $path -eq "api/load-data-DefaulFields") {
        try {
            # Define the file path for the Default Fields JSON file
            $filePath = "$dataDir\DefaultFields.json"

            # Check if the file exists
            if (-not (Test-Path $filePath)) {
                $response.StatusCode = 404
                [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': 'Default Fields data file not found.'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
                return
            }

            # Load the existing Default Fields data
            $jsonData = Get-Content -Path $filePath -Raw
            $data = ConvertFrom-Json $jsonData

            # Respond with the loaded data
            $response.StatusCode = 200
            [System.Text.Encoding]::UTF8.GetBytes(($jsonData -replace "'", '"')) | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } catch {
            # Log the error and respond with an error status
            $errorMessage = $_.Exception.Message
            Write-Host "Error loading Default Fields data: $errorMessage"
            $response.StatusCode = 500
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': '$errorMessage'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
    }

    elseif ($request.HttpMethod -eq "POST" -and $path -eq "api/save-data-DefaulFieldsFile") {
        try {
            # Read the incoming JSON data from the request body
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $jsonData = $reader.ReadToEnd()
            $reader.Close()

            # Parse the JSON data
            $data = ConvertFrom-Json $jsonData

            # Define the file path for the Default Fields JSON file
            $filePath = "$dataDir\DefaultFieldsFile.json"

            # Write the updated JSON data to the file
            $jsonData | Set-Content -Path $filePath -Encoding utf8

            Write-Host "Saved Default Fields data to $filePath"

            # Respond with success status
            $response.StatusCode = 200
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'success'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } catch {
            # Log the error and respond with an error status
            $errorMessage = $_.Exception.Message
            Write-Host "Error saving Default Fields data: $errorMessage"
            $response.StatusCode = 500
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': '$errorMessage'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
    }

    elseif ($request.HttpMethod -eq "GET" -and $path -eq "api/load-data-DefaulFieldsFile") {
        try {
            # Define the file path for the Default Fields JSON file
            $filePath = "$dataDir\DefaultFieldsFile.json"

            # Check if the file exists
            if (-not (Test-Path $filePath)) {
                $response.StatusCode = 404
                [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': 'Default Fields data file not found.'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
                return
            }

            # Load the existing Default Fields data
            $jsonData = Get-Content -Path $filePath -Raw
            $data = ConvertFrom-Json $jsonData

            # Respond with the loaded data
            $response.StatusCode = 200
            [System.Text.Encoding]::UTF8.GetBytes(($jsonData -replace "'", '"')) | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } catch {
            # Log the error and respond with an error status
            $errorMessage = $_.Exception.Message
            Write-Host "Error loading Default Fields data: $errorMessage"
            $response.StatusCode = 500
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': '$errorMessage'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
    }

        # API: Load JSON Data for Mapping
    elseif ($request.HttpMethod -eq "GET" -and $path -eq "api/load-data-Mapping") {
        try {
            # Define the file path for the Mapping JSON file
            $filePath = "$dataDir\Mapping.json"

            # Check if the file exists
            if (-not (Test-Path $filePath)) {
                $response.StatusCode = 404
                [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': 'Mapping data file not found.'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
                return
            }

            # Load the existing Mapping data
            $jsonData = Get-Content -Path $filePath -Raw
            $data = ConvertFrom-Json $jsonData

            # Respond with the loaded data
            $response.StatusCode = 200
            [System.Text.Encoding]::UTF8.GetBytes(($jsonData -replace "'", '"')) | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } catch {
            # Log the error and respond with an error status
            $errorMessage = $_.Exception.Message
            Write-Host "Error loading Mapping data: $errorMessage"
            $response.StatusCode = 500
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': '$errorMessage'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
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

    # API: Delete VLOOKUP Data by Key (Key in Request Body)
    elseif ($request.HttpMethod -eq "DELETE" -and $path -eq "api/delete-vlookup") {
        try {
            # Read the raw incoming request body
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $jsonData = $reader.ReadToEnd()
            $reader.Close()

            # Log the raw request body to a file for debugging
            Add-Content -Path "$dataDir\error.txt" -Value "Raw Request Body: $jsonData"

            # Attempt to parse the JSON payload
            try {
                $payload = ConvertFrom-Json $jsonData
            } catch {
                $errorMessage = "Failed to parse JSON payload: $_"
                Write-Host $errorMessage
                Add-Content -Path "$dataDir\error.txt" -Value $errorMessage
                throw $errorMessage
            }

            # Extract the key from the payload
            $key = $payload.key

            if (-not $key) {
                $errorMessage = "Key not provided in the request body."
                Write-Host $errorMessage
                Add-Content -Path "$dataDir\error.txt" -Value $errorMessage
                throw $errorMessage
            }

            Write-Host "Deleting VLOOKUP with key: $key"

            # Path to the VLOOKUP JSON file
            $filePath = "$dataDir\VlookupManager.json"

            # Check if the file exists
            if (-not (Test-Path $filePath)) {
                $errorMessage = "VLOOKUP data file not found."
                Write-Host $errorMessage
                Add-Content -Path "$dataDir\error.txt" -Value $errorMessage
                throw $errorMessage
            }

            # Load the existing VLOOKUP data
            $existingDataJson = Get-Content -Path $filePath -Raw
            $data = ConvertFrom-Json $existingDataJson

            # Check if the key exists in the data
            if ($data.PSObject.Properties.Name -contains $key) {
                # Remove the key-value pair from the data
                $data.PSObject.Properties.Remove($key)

                # Save the updated data back to the file
                $updatedDataJson = ConvertTo-Json $data -Depth 10
                Set-Content -Path $filePath -Value $updatedDataJson -Encoding utf8

                Write-Host "Deleted VLOOKUP with key: $key"

                # Respond with success status
                $response.StatusCode = 200
                [System.Text.Encoding]::UTF8.GetBytes("{'status': 'success', 'message': 'VLOOKUP deleted successfully.'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
            } else {
                # Respond with error if the key is not found
                $response.StatusCode = 404
                [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': 'VLOOKUP with key `$key` not found.'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
            }
        } catch {
            # Log the full error details to error.txt
            $errorMessage = $_.Exception.Message
            Write-Host "Error deleting VLOOKUP: $errorMessage"
            Add-Content -Path "$dataDir\error.txt" -Value "Error deleting VLOOKUP: $errorMessage"

            # Respond with a 500 Internal Server Error
            $response.StatusCode = 500
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': '$errorMessage'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        }
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
    # Default fallback: Redirect to index.html
    else {
        # Check if the request is for an API endpoint
        if ($path -like "api/*") {
            # Respond with 404 for unmatched API requests
            $response.StatusCode = 404
            [System.Text.Encoding]::UTF8.GetBytes("{'status': 'error', 'message': 'API endpoint not found'}") | ForEach-Object { $response.OutputStream.Write($_, 0, $_.Length) }
        } else {
            # Redirect non-API requests to index.html
            $redirectUrl = "http://localhost:$port/index.html"
            $response.Headers.Set("Location", $redirectUrl)
            $response.StatusCode = 302  # Temporary redirect
        }
        $response.OutputStream.Close()
        continue
    }

    $response.OutputStream.Close()
}