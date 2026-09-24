Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile('D:\company projects\Shubham_Academy\public\images\login-left-bg.png')

# Let's inspect the gradient colors on the left
# At x=20, y=50, y=150, y=300, y=450, y=550
for ($y = 20; $y -lt 570; $y += 60) {
    $p = $src.GetPixel(30, $y)
    "y: $y -> R:$($p.R), G:$($p.G), B:$($p.B)"
}

$src.Dispose()
