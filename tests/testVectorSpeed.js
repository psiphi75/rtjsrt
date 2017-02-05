const COUNTS = 50000000;

//
//
//
// OBJECT
//
//
//


function VectorObject(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}
VectorObject.prototype.dot = function(w) {
    return this.x * w.x + this.y * w.y + this.z * w.z;
};
VectorObject.prototype.add = function(w) {
    return new VectorObject(this.x + w.x, this.y + w.y, this.z + w.z);
};
VectorObject.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};
VectorObject.prototype.normalise = function() {
    var s = 1 / this.length(this);
    return new VectorObject(this.x * s, this.y * s, this.z * s);
};

var start = new Date().getTime();
var zzz = 0 / 1e18;
for (let i = 0; i < COUNTS; i++) {
    let a = new VectorObject(0, 1, zzz);
    let b = new VectorObject(0, 2, 2);

    let x = a.add(b);
    x = x.add(b);
    x = x.add(a);
    x = x.normalise();
    x = x.add(a);
    zzz = x.dot(x) / 1e18;
}
console.log('OBJECT: ', (new Date().getTime() - start) / 1000, zzz);

//
//
//
// OBJECT
//
//
//

function VectorObjectInplace(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}
VectorObjectInplace.prototype.dot = function(w) {
    return this.x * w.x + this.y * w.y + this.z * w.z;
};
VectorObjectInplace.prototype.add = function(w) {
    return new VectorObjectInplace(this.x + w.x, this.y + w.y, this.z + w.z);
};
VectorObjectInplace.prototype.addInplace = function(w) {
    this.x += w.x;
    this.y += w.y;
    this.z += w.z;
};
VectorObjectInplace.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};
VectorObjectInplace.prototype.normalise = function() {
    var s = 1 / this.length(this);
    return new VectorObjectInplace(this.x * s, this.y * s, this.z * s);
};
VectorObjectInplace.prototype.normaliseInplace = function() {
    var s = 1 / this.length(this);
    this.x *= s;
    this.y *= s;
    this.z *= s;
};

start = new Date().getTime();
zzz = 0 / 1e18;
for (let i = 0; i < COUNTS; i++) {
    let a = new VectorObjectInplace(0, 1, zzz);
    let b = new VectorObjectInplace(0, 2, 2);

    let x = a.add(b);
    x.addInplace(b);
    x.addInplace(a);
    x.normaliseInplace();
    x.addInplace(a);
    zzz = x.dot(x) / 1e18;
}
console.log('OBJECT INLINE: ', (new Date().getTime() - start) / 1000, zzz);


//
//
//
// NEW
//
//
//

const vectorNew = {
    make: function(x, y, z) {
        return [x, y, z];
    },
    dot: function(v, w) {
        return v[0] * w[0] + v[1] * w[1] + v[2] * w[2];
    },
    add: function(v, w) {
        return [v[0] + w[0], v[1] + w[1], v[2] + w[2]];
    },
    length: function(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    },
    normalise: function(v) {
        var s = 1 / vectorNew.length(v);
        return [v[0] * s, v[1] * s, v[2] * s];
    }
};

start = new Date().getTime();
zzz = 0 / 1e18;
for (let i = 0; i < COUNTS; i++) {
    let a = vectorNew.make(0, 1, zzz);
    let b = vectorNew.make(0, 2, 2);

    let x = vectorNew.add(a, b);
    x = vectorNew.add(x, b);
    x = vectorNew.add(x, a);
    x = vectorNew.normalise(x);
    x = vectorNew.add(x, a);
    zzz = vectorNew.dot(x, x) / 1e18;
}
console.log('NEW: ', (new Date().getTime() - start) / 1000, zzz);

//
//
//
// PROVIDE
//
//
//

const vectorProvide = {
    make: function(x, y, z) {
        return [x, y, z];
    },
    dot: function(v, w) {
        return v[0] * w[0] + v[1] * w[1] + v[2] * w[2];
    },
    add: function(a, v, w) {
        a[0] = v[0] + w[0];
        a[1] = v[1] + w[1];
        a[2] = v[2] + w[2];
    },
    length: function(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    },
    normalise: function(a, v) {
        var s = 1 / vectorProvide.length(v);
        a[0] = v[0] * s;
        a[1] = v[1] * s;
        a[2] = v[2] * s;
    }
};

start = new Date().getTime();
zzz = 0 / 1e18;
for (let i = 0; i < COUNTS; i++) {
    let a = vectorProvide.make(0, 1, zzz);
    let b = vectorProvide.make(0, 2, 2);

    let x = vectorProvide.make(0, 0, 0);
    vectorProvide.add(x, a, b);
    vectorProvide.add(x, x, b);
    vectorProvide.add(x, x, a);
    vectorProvide.normalise(x, x);
    vectorProvide.add(x, x, a);
    zzz = vectorProvide.dot(x, x) / 1e18;
}
console.log('PROVIDE: ', (new Date().getTime() - start) / 1000, zzz);

//
//
//
// INLINE
//
//
//

const vectorInline = {
    make: function(x, y, z) {
        return [x, y, z];
    },
    dot: function(v, w) {
        return v[0] * w[0] + v[1] * w[1] + v[2] * w[2];
    },
    add: function(a, v, w) {
        a[0] = v[0] + w[0];
        a[1] = v[1] + w[1];
        a[2] = v[2] + w[2];
    },
    addInplace: function(v, w) {
        v[0] += w[0];
        v[1] += w[1];
        v[2] += w[2];
    },
    length: function(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    },
    normalise: function(a, v) {
        var s = 1 / vectorProvide.length(v);
        a[0] = v[0] * s;
        a[1] = v[1] * s;
        a[2] = v[2] * s;
    },
    normaliseInplace: function(v) {
        var s = 1 / vectorInline.length(v);
        v[0] *= s;
        v[1] *= s;
        v[2] *= s;
    }
};

start = new Date().getTime();
zzz = 0 / 1e18;
for (let i = 0; i < COUNTS; i++) {
    let a = vectorInline.make(0, 1, zzz);
    let b = vectorInline.make(0, 2, 2);

    let x = vectorInline.make(0, 0, 0);
    vectorInline.add(x, a, b);
    vectorInline.addInplace(x, b);
    vectorInline.addInplace(x, a);
    vectorInline.normaliseInplace(x);
    vectorInline.addInplace(x, a);
    zzz = vectorInline.dot(x, x) / 1e18;
}
console.log('INLINE: ', (new Date().getTime() - start) / 1000, zzz);
