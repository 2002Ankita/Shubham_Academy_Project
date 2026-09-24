Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile('D:\company projects\Shubham_Academy\public\images\login-mockup-full.png')

# 1. Crop full left banner (0 to 584)
$rectBanner = [System.Drawing.Rectangle]::new(0, 0, 584, 576)
$banner = $src.Clone($rectBanner, $src.PixelFormat)
$banner.Save('D:\company projects\Shubham_Academy\public\images\login-left-bg.png', [System.Drawing.Imaging.ImageFormat]::Png)
$banner.Dispose()

# 2. Crop students illustration area (around x: 190 to 584, y: 120 to 576)
$rectStudents = [System.Drawing.Rectangle]::new(190, 120, 394, 456)
$students = $src.Clone($rectStudents, $src.PixelFormat)
$students.Save('D:\company projects\Shubham_Academy\public\images\login-students-crop.png', [System.Drawing.Imaging.ImageFormat]::Png)
$students.Dispose()

$src.Dispose()
"Images cropped successfully!"
