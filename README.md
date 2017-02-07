# rtjsrt
Realtime Javascript Raytracer - just a small toy project

# Things that can be done

 - Create node.js runable.
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
