
Refreshing concepts. useful reference: 
* [Intro to Computer Graphics](http://math.hws.edu/graphicsbook)

## MATRIX MATH REFRESHER

To refresh our memory on matrix operations in computer graphics, a free online reference is [Intro to Computer Graphics](http://math.hws.edu/graphicsbook)

From [bottom of this page](http://math.hws.edu/graphicsbook/c2/s3.html), this is the **2D** transform:
```
TRANSLATE   SCALE      ROTATE

1 0 a       a 0 0       cos(d) -sin(d) 0
0 1 b       0 b 0       sin(d)  cos(d) 0
0 0 1       0 0 1       0       0      1
```

Matrices can be combined into a single matrix through matrix multiplication, but the order of application of the transforms is read from LAST TRANSFORM to FIRST. Because Math.

In general, our objects are defined around a local origin of (0,0) which is also the point of rotation. The order of operations to plot a local origin to point X,Y is to SCALE, ROTATE, TRANSLATE.

## PTRACK NORMALIZATION

The PTrack system produces coordinates within a space where the origin and axis rotation must be experimentally determnined after mapping the bounds of the space. DevTracker will be used to determine and save the translation information.

#### PTrack Calibration Steps

_Based on [How to Calibrate](https://gitlab.com/stepsys/plae/PLAE/-/wikis/USER-MANUAL:-How-to-calibrate-tracking-and-video-overlay) wiki for PLAE_

0. `offset x, y` - **Set the Origin** - Have someone in the space as a "marker". Have the marker stand where you want "dead center" to be. This will be the origin 0,0. Adjust offset X,Y until the dot is at 0,0. **MARK WITH TAPE** so you can find the origin later.

0. `rot z` - **Set Rotation** - Have the marker walk left and right in a straight line, parallel to the screen. If the marker is rotated, adjust the ROTATION value until it is correct.

0. `scale x,y` - **Set Coverage** - Have 4 markers stand at each corner of the usable space. We want to map them to the 4 corners of the tracker utility by adjusting the X and Y scale values. **MARK** where each marker was standing with floor tape. 

0. With the space defined, you may find it useful to accurately **MARK X and Y AXIS** with floor tape.

#### Normalization Algorithm

PTrack coordinates are converted to normalized coordinates with range `[-1, 1]` (axis type). Coordinates that are within `[-1,1]` are considered within the **simulation bounds**, though it is possible for PTrack to produce values outside this range. The system may want to plot markers outside the simulation bounds to have kids queue up outside the marked space.

They are applied in the same order we calibrate the system: `translate -> rotate -> scale` 

**Reference Algorithm** is in PLAE in `step/input.js`

* The client-side PTRACK module just forwards the track data from UDP. This is raw coordinates. 
* raw PTRACK data is transformed by `m_transform.matrix_align` in `m_TransformAndUpdate( entity, trackerObj )`
* `matrix_align` is set in `m_UpdateLocationTransform()`, which pulls the settings from `m_transform` and creates the matrix in this order
  * `scale -> rotate -> translate` 

Again, the order is important: See [this demo](https://www.mathsisfun.com/algebra/matrix-transform.html), and **remember that the order of operations is read from right-to-left** when interpreting a chain of matrix multiplications. In other words: `M = Tr * Sc * Ro` would create a matrix `M` that rotates, then scales, then translates. 

Therefore in OUR `scale -> rotate -> translate` matrix,  the effect is translate, rotate, then scale: the correct order for aligning the PTrack coordinate system. This is because each subsequent multiplication affects the previous one in entirety:

* `scale` is the first operation
* `rotate` is operating on `scale`
* `translate` is operating on `scale` and `rotate`

This corresponds to doing the following operations one-by-one:

* `translate` point
* then `rotate` what you just `translated`
* then `scale` what you just `rotated` and `translated` 

This is the order of operations of the calibration procedure. To recreate it as a single matrix, `M = S * R * T`

DIZZYING! The important takewaway: **just remember to evaluate pre-multiplied matrix operations from right to left**. 



## GL MATRIX METHODS REFERENCE (WIP)

To reorganize by functional group, then alphabetically
note: all methods are static or constant!

glMatrix module

    equals(a, b) (within epsilon)
    setMatrixArrayType(type)
    toRadian(a)

mat2

    add(out, a, b) → {mat2}
    adjoint(out, a) → {mat2}
    clone(a) → {mat2}
    copy(out, a) → {mat2}
    create() → {mat2}
    determinant(a) → {Number}
    equals(a, b) → {Boolean}
    exactEquals(a, b) → {Boolean}
    frob(a) → {Number}
    fromRotation(out, rad) → {mat2}
    fromScaling(out, v) → {mat2}
    fromValues(m00, m01, m10, m11) → {mat2}
    identity(out) → {mat2}
    invert(out, a) → {mat2}
    LDU(L, D, U, a)
    mul()
    multiply(out, a, b) → {mat2}
    multiplyScalar(out, a, b) → {mat2}
    multiplyScalarAndAdd(out, a, b, scale) → {mat2}
    rotate(out, a, rad) → {mat2}
    scale(out, a, v) → {mat2}
    set(out, m00, m01, m10, m11) → {mat2}
    str(a) → {String}
    sub()
    subtract(out, a, b) → {mat2}
    transpose(out, a) → {mat2}

mat2d

    add(out, a, b) → {mat2d}
    clone(a) → {mat2d}
    copy(out, a) → {mat2d}
    create() → {mat2d}
    determinant(a) → {Number}
    equals(a, b) → {Boolean}
    exactEquals(a, b) → {Boolean}
    frob(a) → {Number}
    fromRotation(out, rad) → {mat2d}
    fromScaling(out, v) → {mat2d}
    fromTranslation(out, v) → {mat2d}
    fromValues(a, b, c, d, tx, ty) → {mat2d}
    identity(out) → {mat2d}
    invert(out, a) → {mat2d}
    mul()
    multiply(out, a, b) → {mat2d}
    multiplyScalar(out, a, b) → {mat2d}
    multiplyScalarAndAdd(out, a, b, scale) → {mat2d}
    rotate(out, a, rad) → {mat2d}
    scale(out, a, v) → {mat2d}
    set(out, a, b, c, d, tx, ty) → {mat2d}
    str(a) → {String}
    sub()
    subtract(out, a, b) → {mat2d}
    VM528:2 translate(out, a, v) → {mat2d}

mat3

    add(out, a, b) → {mat3}
    adjoint(out, a) → {mat3}
    clone(a) → {mat3}
    copy(out, a) → {mat3}
    create() → {mat3}
    determinant(a) → {Number}
    equals(a, b) → {Boolean}
    exactEquals(a, b) → {Boolean}
    frob(a) → {Number}
    fromMat2d(out, a) → {mat3}
    fromMat4(out, a) → {mat3}
    fromQuat(out, q) → {mat3}
    fromRotation(out, rad) → {mat3}
    fromScaling(out, v) → {mat3}
    fromTranslation(out, v) → {mat3}
    fromValues(m00, m01, m02, m10, m11, m12, m20, m21, m22) → {mat3}
    identity(out) → {mat3}
    invert(out, a) → {mat3}
    mul()
    multiply(out, a, b) → {mat3}
    multiplyScalar(out, a, b) → {mat3}
    multiplyScalarAndAdd(out, a, b, scale) → {mat3}
    normalFromMat4(out, a) → {mat3}
    projection(out, width, height) → {mat3}
    rotate(out, a, rad) → {mat3}
    scale(out, a, v) → {mat3}
    set(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) → {mat3}
    str(a) → {String}
    sub()
    subtract(out, a, b) → {mat3}
    translate(out, a, v) → {mat3}
    transpose(out, a) → {mat3}


mat4

    add(out, a, b) → {mat4}
    adjoint(out, a) → {mat4}
    clone(a) → {mat4}
    copy(out, a) → {mat4}
    create() → {mat4}
    determinant(a) → {Number}
    equals(a, b) → {Boolean}
    exactEquals(a, b) → {Boolean}
    frob(a) → {Number}
    fromQuat(out, q) → {mat4}
    fromQuat2(out, a) → {mat4}
    fromRotation(out, rad, axis) → {mat4}
    fromRotationTranslation(out, q, v) → {mat4}
    fromRotationTranslationScale(out, q, v, s) → {mat4}
    fromRotationTranslationScaleOrigin(out, q, v, s, o) → {mat4}

quat

    (constant) equals
    (constant) exactEquals
    (constant) length
    (constant) rotationTo → function(out,a,b)
    (constant) setAxes → function(out, view, right, up)
    (constant) sqlerp → function(out, a, b, c, d, t)
    add(out, a, b) → {quat}
    calculateW(out, a) → {quat}
    clone(a) → {quat}
    conjugate(out, a) → {quat}
    copy(out, a) → {quat}
    create() → {quat}
    dot(a, b) → {Number}
    exp(out, a) → {quat}
    fromEuler(out, Angle, Angle, Angle) → {quat}
    fromMat3(out, m) → {quat}  

quat2

    add(out, a, b) → {quat2}
    clone(a) → {quat2}
    conjugate(out, a) → {quat2}
    copy(out, a) → {quat2}
    create() → {quat2}
    dot(a, b) → {Number}
    equals(a, b) → {Boolean}
    exactEquals(a, b) → {Boolean}
    fromMat4(out, a) → {quat2}
    fromRotation(dual, q) → {quat2}
    fromRotationTranslation(dual, q, t) → {quat2}
    fromRotationTranslationValues(x1, y1, z1, w1, x2, y2, z2) → {quat2}
    fromTranslation(dual, t) → {quat2}
    fromValues(x1, y1, z1, w1, x2, y2, z2, w2) → {quat2}
    getDual(out, a) → {quat}
    getTranslation(out, a) → {vec3}
    identity(out) → {quat2}
    invert(out, a) → {quat2}
    len()
    length(a) → {Number}
    lerp(out, a, b, t) → {quat2}
    mul()
    multiply(out, a, b) → {quat2}
    normalize(out, a) → {quat2}
    rotateAroundAxis(out, a, axis, rad) → {quat2}
    rotateByQuatAppend(out, a, q) → {quat2}
    rotateByQuatPrepend(out, q, a) → {quat2}
    rotateX(out, a, rad) → {quat2}
    rotateY(out, a, rad) → {quat2}
    rotateZ(out, a, rad) → {quat2}
    scale(out, a, b) → {quat2}
    set(out, x1, y1, z1, w1, x2, y2, z2, w2) → {quat2}
    setDual(out, q) → {quat2}
    setReal(out, q) → {quat2}
    sqrLen()
    squaredLength(a) → {Number}
    str(a) → {String}
    translate(out, a, v) → {quat2}

vec2

    add(out, a, b) → {vec2}
    angle(a, b) → {Number}
    ceil(out, a) → {vec2}
    clone(a) → {vec2}
    copy(out, a) → {vec2}
    create() → {vec2}
    cross(out, a, b) → {vec3}
    dist()
    distance(a, b) → {Number}
    div()
    divide(out, a, b) → {vec2}
    dot(a, b) → {Number}
    equals(a, b) → {Boolean}
    exactEquals(a, b) → {Boolean}
    floor(out, a) → {vec2}
    forEach(a, stride, offset, count, fn, argopt) → {Array}
    fromValues(x, y) → {vec2}
    inverse(out, a) → {vec2}
    len()
    length(a) → {Number}
    lerp(out, a, b, t) → {vec2}
    max(out, a, b) → {vec2}
    min(out, a, b) → {vec2}
    mul()
    multiply(out, a, b) → {vec2}
    negate(out, a) → {vec2}
    normalize(out, a) → {vec2}
    random(out, scaleopt) → {vec2}
    rotate(out, a, b, rad) → {vec2}
    round(out, a) → {vec2}
    scale(out, a, b) → {vec2}
    scaleAndAdd(out, a, b, scale) → {vec2}
    set(out, x, y) → {vec2}
    sqrDist()
    sqrLen()
    squaredDistance(a, b) → {Number}
    squaredLength(a) → {Number}
    str(a) → {String}
    sub()
    subtract(out, a, b) → {vec2}
    transformMat2(out, a, m) → {vec2}
    transformMat2d(out, a, m) → {vec2}
    transformMat3(out, a, m) → {vec2}
    transformMat4(out, a, m) → {vec2}
    zero(out) → {vec2}

vec3

    add(out, a, b) → {vec3}
    angle(a, b) → {Number}
    bezier(out, a, b, c, d, t) → {vec3}
    ceil(out, a) → {vec3}
    clone(a) → {vec3}
    copy(out, a) → {vec3}
    create() → {vec3}
    cross(out, a, b) → {vec3}
    dist()
    distance(a, b) → {Number}
    div()
    divide(out, a, b) → {vec3}
    dot(a, b) → {Number}
    equals(a, b) → {Boolean}
    exactEquals(a, b) → {Boolean}
    floor(out, a) → {vec3}
    forEach(a, stride, offset, count, fn, argopt) → {Array}
    fromValues(x, y, z) → {vec3}
    hermite(out, a, b, c, d, t) → {vec3}
    inverse(out, a) → {vec3}
    len()
    length(a) → {Number}
    lerp(out, a, b, t) → {vec3}
    max(out, a, b) → {vec3}
    min(out, a, b) → {vec3}
    mul()
    multiply(out, a, b) → {vec3}
    negate(out, a) → {vec3}
    normalize(out, a) → {vec3}
    random(out, scaleopt) → {vec3}
    rotateX(out, a, b, rad) → {vec3}
    rotateY(out, a, b, rad) → {vec3}
    rotateZ(out, a, b, rad) → {vec3}
    round(out, a) → {vec3}
    scale(out, a, b) → {vec3}
    scaleAndAdd(out, a, b, scale) → {vec3}
    set(out, x, y, z) → {vec3}
    sqrDist()
    sqrLen()
    squaredDistance(a, b) → {Number}
    squaredLength(a) → {Number}
    str(a) → {String}
    sub()
    subtract(out, a, b) → {vec3}
    transformMat3(out, a, m) → {vec3}
    transformMat4(out, a, m) → {vec3}
    transformQuat(out, a, q) → {vec3}
    zero(out) → {vec3}

vec4

    add(out, a, b) → {vec4}
    ceil(out, a) → {vec4}
    clone(a) → {vec4}
    copy(out, a) → {vec4}
    create() → {vec4}
    cross(result, U, V, W) → {vec4}
    dist()
    distance(a, b) → {Number}
    div()
    divide(out, a, b) → {vec4}
    dot(a, b) → {Number}
    equals(a, b) → {Boolean}
    exactEquals(a, b) → {Boolean}
    floor(out, a) → {vec4}
    forEach(a, stride, offset, count, fn, argopt) → {Array}
    fromValues(x, y, z, w) → {vec4}
    inverse(out, a) → {vec4}
    len()
    length(a) → {Number}
    lerp(out, a, b, t) → {vec4}
    max(out, a, b) → {vec4}
    min(out, a, b) → {vec4}
    mul()
    multiply(out, a, b) → {vec4}
    negate(out, a) → {vec4}
    normalize(out, a) → {vec4}
    random(out, scaleopt) → {vec4}
    round(out, a) → {vec4}
    scale(out, a, b) → {vec4}
    scaleAndAdd(out, a, b, scale) → {vec4}
    set(out, x, y, z, w) → {vec4}
    sqrDist()
    sqrLen()
    squaredDistance(a, b) → {Number}
    squaredLength(a) → {Number}
    str(a) → {String}
    sub()
    subtract(out, a, b) → {vec4}
    transformMat4(out, a, m) → {vec4}
    transformQuat(out, a, q) → {vec4}
    zero(out) → {vec4}

---
scraper code
``` js
let methods = document.querySelectorAll('h4.name');
methods.forEach(m=>console.log(m.textContent));
```
