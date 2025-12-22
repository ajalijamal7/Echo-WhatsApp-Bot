if (-not (Test-Path ".env")) {
    "#====================================" | Out-File -FilePath .env
    "#Environment configuration template" | Out-File -FilePath .env -Append
    "#====================================" | Out-File -FilePath .env -Append
    "#1. Use the `.checkid` command of the bot to get your id and put it in the OWNERS variable. If multiple owners exist, add a comma between them (e.g., 5468764,46456465). then restart the bot" | Out-File -FilePath .env -Append
    "#2. Get your Gemini API key from https://aistudio.google.com/api-keys (if you want to enable AI features)" | Out-File -FilePath .env -Append
    "#3. Get your remove.bg API key from https://www.remove.bg/api" | Out-File -FilePath .env -Append
    "" | Out-File -FilePath .env -Append
    "OWNERS=" | Out-File -FilePath .env -Append
    "GEMINI_API_KEY=" | Out-File -FilePath .env -Append
    "REMOVE_BG_API_KEY=" | Out-File -FilePath .env -Append

    Write-Host "Template .env file created successfully."
} else {
    Write-Host ".env file already exists, skipping creation."
}
