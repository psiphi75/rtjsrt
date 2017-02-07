
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

# 15 - Precalc some of the ray math

=> 229/min

Reverted back.

# 16 - Refactored raytrace()

=> 248/min

Added purposful timing.  Found the following results (didn't believe the profiler):
Function ----- time (ms) -- Calls
raytrace        569,       661011
getShadeAtPoint 215,       365787
intersect       782,      3622240

# 17 - Tried forEach loop on native Array

=> 171/min

# 18 - Changed Intersection to Object

=> 225/min

# 19 - Changed Intersection back and to return null

=> 250/min

# 20 - Removed Math.sin function

=> 272/min

# 21 - Scale then add in one operation

I thought this would speed things up.
=> 57 / min

# 22 - Warm up the compiler

=> 255/min

# 23 - ClosureCompiler

=> 255/min

# 24 - Threads

Bad performance due to array copying

=> 23.4/min (measured in browser)

# 25 - Threads with better array copying

=> 226/min (1 thread, measured in browser)
=> 437/min (2 threads, measured in browser)
=> 567/min (3 threads, measured in browser)
=> 640/min (4 threads, measured in browser)
=> 756/min (5 threads, measured in browser)
=> 792/min (6 threads, measured in browser)
=> 786/min (7 threads, measured in browser)
=> 780/min (8 threads, measured in browser)

1 threads => 270/min
2 threads => 501/min
3 threads => 681/min
4 threads => 855/min
5 threads => 855/min
6 threads => 872/min
7 threads => 861/min
8 threads => 940/min
12 threads => 891/min
16 threads => 879/min
32 threads => 804/min

# 26 - Refactor getShadeAtPoint

8 threads => 1014/min

# 27 - Use node-gyp with C++

8 thread => 53/min

Went very slow, even with gcc opitimisations in place.  I presume for a small
peice of code C++ is not worth it.

# 28 - Start reducing the number of new Colour objects

8 threads => 1032/min
