Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile('D:\company projects\Shubham_Academy\public\images\login-left-bg.png')
$width = $src.Width
$height = $src.Height

# Create a clean canvas
$clean = [System.Drawing.Bitmap]::new($width, $height)
$g = [System.Drawing.Graphics]::FromImage($clean)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# Draw the original image
$g.DrawImage($src, 0, 0, $width, $height)

# On the left side (x: 0 to 220), let's see: we want to smoothly blend over the old baked-in text so we can render crisp HTML text and crisp 3D logo
# Let's inspect where the student's yellow hoodie starts: around x = 210 to 230
# Let's check pixel colors from x = 180 to 250 at y = 350
$src.Dispose()
$clean.Dispose()
$g.Dispose()
"Done checking"
