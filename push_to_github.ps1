Set-Location 'C:\Users\Degreat\Desktop\Youth_projet'
git --version
if (-not (Test-Path '.git')) {
  git init
  git config user.email 'dev@local'
  git config user.name 'Dev'
  git add .
  try { git commit -m 'Initial commit from agent' } catch {}
} else {
  $s = git status --porcelain
    if ($s) {
    git add .
    try { git commit -m 'Update before push' } catch {}
  } else {
    Write-Output 'No changes to commit'
  }
}
try {
  git remote remove origin 2>$null
} catch {}
try {
  git remote add origin 'https://github.com/Alexdoned/Youth_projet.git'
} catch { Write-Output $_ }
git branch -M main
try {
  git push -u origin main
} catch { Write-Output $_; exit 1 }
