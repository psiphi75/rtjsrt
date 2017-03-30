3rd party applications
More on IRHydra in a later post


# Optimising JavaScript for performance

1. Introduction (Ray tracing, Node), disclaimer, other language shootout.  Devs with powerful PCs
2. Process (dev, test, analyse), Tools (tools I used, howtos), Techniques (benchmarking, code gists).
   ES5: V8 optmises for real world JS, http://v8project.blogspot.co.nz/2016/12/how-v8-measures-real-world-performance.html
3. Memory -  memory allocated was not looked at.  But talk about GC.
4. Gyp + Multitasking



# Features

 - Runs in Node.js runable.
 - Reduce object creation to reduce GC.
 - use [ImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap) for the browser.  This will enable direct copying between
   workers and direct drawing to the canvas.
 - For node try GYP (say "jip")
 - Make sure the Objects are initailised in the same order.  Extend these objects.


Greate Video: https://www.youtube.com/watch?v=UJPdhx5zTaw&feature=youtu.be&t=31m30s
V8 has two compilers
 - Full compiler - compiler to create code quickly
 - Optimising compiler - compiler that produces optimised code - re-compiles hot functions

# Performance

0. Begin with idiomatic code that works
1. Identify issue
2. Measure
3. Dev
4. Test
5. Commit or revert

# Tips:
## Prefer monomorphic code to polymorphic

```JavaScript
function add(a, b) {
    return a + b;
}
add(1, 2);          // Starts as monomorphic
add(2, 3);          // Still monomorphic
add('x', 'y');      // Now becomes polymorphic
```

## Avoid try - catch in performace sensitive block of code

## Once an object is initialised with contrustor don't change it's "shape"

- Hidden class will change

```JavaScript
fuction vector(x, y) {
    this.x = x;
    this.y = y;
}

vector a = new vector(1, 2);
vector b = new vector(3, 4);
b.z = 5;                        // Don't do this
```


# 00 - Baseline
=> 101/min (1.6833)

# 01
Changed vector from [] to new Float32Array
=> 8/min (0.133)

# 02
Changed vector from [] to new Array
=> 4/min (0.06667)

# 03 - Optimising vector.dot()
14 occurences reduced to 12
=> 112/min (1.867)

# 04 - Upgrade from Node 4.2 to 6.9
=> 113/min (1.883)

# 05 - Use SIMD instructions
It's going be slow for some time, read: https://groups.google.com/a/chromium.org/forum/#!topic/chromium-discuss/VEbF2KEmV-I
=> 35/min (0.583)

# 06 - Enhanced vector math to re-use objects
=> 107/min (1.783)

# 07 - Use const and let
=> 86/min (1.43)

# 08 - Do some pre-calculations
=> 110/min (1.833)

# 09 - Render Squares

I was expecting a 20 to 30% boost here.  Not a slow down.

If the corners of the square are black, then we just fill in the square.  The funny
this is that this actually went slower.  Need to look at the profiler.
=> 106/min (1.766)

# 11 - Changed vector object pattern
Significant performance improvement.  The Vetor.dot function has gone from around 19% to 1.6%.
=> 212/min (3.533)

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

# 29 - Colour is now mainly just a reference and not created new

8 threads => 1054/min

# 30 - Improved memory copying

8 threads => 1074/min (SQUARE_SIZE = 6)
8 threads => 1084/min (SQUARE_SIZE = 8)
8 threads => 1095/min (SQUARE_SIZE = 12)

Let JS do the memory copy, instead of for loop.

# 31 - Improved memory copying

8 threads => 940/min (SQUARE_SIZE = 12)

Let JS do the memory copy, instead of for loop.

# 32 - raytraceStrip "enhancements"

8 threads => 930/min (SQUARE_SIZE = 12)

Let JS do the memory copy, instead of for loop.

# 33 - Baseline

Had to re-baseline the tests.  Since some at #30 seemed a bit off
8 threads => 1054/min (SQUARE_SIZE = 8)
8 threads => 1054/min (SQUARE_SIZE = 12)

# 34 - Faster (in theory) Sphere Intersection

8 threads => 1026/min (SQUARE_SIZE = 6)
8 threads => 1026/min (SQUARE_SIZE = 8)
8 threads => 1056/min (SQUARE_SIZE = 12)
8 threads => 978/min (SQUARE_SIZE = 24)

# 35 - Render from bottom up

+4.5%
