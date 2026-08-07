Copy-Item ".\index.backup.html" ".\index.html" -Force
$html = Get-Content ".\index.html" -Raw
$scripts = @"
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase.js"></script>
<script src="js/auth.js"></script>
"@
$html = $html -replace '</body>', "$scripts`n</body>"
Set-Content ".\index.html" $html -Encoding UTF8
Write-Host "Index.html cleaned and fixed successfully!" -ForegroundColor Green
