Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile('D:\company projects\Shubham_Academy\public\images\login-mockup-full.png')
# Find where the background turns white/grey on the right
for ($x = 550; $x -lt 620; $x += 5) {
    $pixel = $src.GetPixel($x, 288)
    "x: $x - R:$($pixel.R), G:$($pixel.G), B:$($pixel.B)"
}
$src.Dispose()
