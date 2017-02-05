
# 01
Changed vector from [] to new Float32Array (x10 slower!!!)

# 02
Changed vector from [] to new Array (x4 slower!!!)

# 03 - Optimising vector.dot()
14 occurences reduced to 12

# 04 - Upgrade from Node 4.2 to 6.9

# 05 - Use SIMD instructions

It's going be slow for some time, read: https://groups.google.com/a/chromium.org/forum/#!topic/chromium-discuss/VEbF2KEmV-I

# 06 - Enhanced vector math to re-use objects

# 07 - Use const and let

# 08 - Do some pre-calculations

# 09 - Render Squares

I was expecting a 20 to 30% boost here.  Not a slow down.

If the corners of the square are black, then we just fill in the square.  The funny
this is that this actually went slower.  Need to look at the profiler.

# 11 - Changed vector object pattern

Significant performance improvement.  The Vetor.dot function has gone from around 19% to 1.6%.

# 12 - Cache some the rays that have already been rendered

Before Caching:
SQUARE_SIZE = 12 => 212/min
SQUARE_SIZE = 8 => 224/min
SQUARE_SIZE = 6 => 214/min
SQUARE_SIZE = 4 => 177/min

After Caching:
SQUARE_SIZE = 24 => 216/min
SQUARE_SIZE = 12 => 219/min
SQUARE_SIZE = 8 => 227/min
SQUARE_SIZE = 6 => 232/min
SQUARE_SIZE = 4 => 213/min

# 13 - set canReceiveShadow and canCreateShadow

Reduces shadow calculations

=> 238/min

# 14 - RayTrace from bottom up

=> 238/min
