Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('D:\company projects\Shubham_Academy\public\images\login-mockup-full.png')
"Width: " + $img.Width + " Height: " + $img.Height
$img.Dispose()
