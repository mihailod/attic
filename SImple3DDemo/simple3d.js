// 3D Rendering from Scratch — JavaScript port of mihailo.Simple3DDemo.SimpleApplet (Mihailo Despotovic, Feb 2011)
// A hand-rolled 3D pipeline: 4x4 world/view transforms, perspective projection,
// backface culling, painter's algorithm z-ordering, ambient and diffuse shading.

// ---- Constants ----

const W = 1300; // screen width
const H = 800;  // screen height

const TETRAHEDRON = 0;
const CUBE = 1;

// Camera: 2.5x farther away than the original (140) with a 2.5x longer focal length (P_RATIO -2),
// so objects start at the same size but with much less wide-angle distortion (~23 deg field of view).
const CAMERA_DISTANCE = 350;
const P_RATIO = -5.0;
const Z_CLIP = -200; // closest zoom: same maximum magnification as the original's -80
const ZOOM_STEP = 2.5; // same zoom speed as the original's step of 1 at distance 140
const XY_CLIP = 20;

const ROTATION_STEP = Math.PI / 60;
const TRANSLATION_STEP = 1;

// java.awt.Color constants
const WHITE   = { r: 255, g: 255, b: 255 };
const BLUE    = { r:   0, g:   0, b: 255 };
const YELLOW  = { r: 255, g: 255, b:   0 };
const CYAN    = { r:   0, g: 255, b: 255 }; // replaces the original's orange, which was too close to yellow
const MAGENTA = { r: 255, g:   0, b: 255 };
const RED     = { r: 255, g:   0, b:   0 };
const GREEN   = { r:   0, g: 255, b:   0 };

// Point light in view space: up and to the left, between the camera and the objects
// (objects never get closer than Z_CLIP, so the light is always in front of them).
// Seen from the objects it's in about the same direction as the original's (-30, 30, 200).
const SPOTLIGHT_POSITION = point(-30, 21, -150);
const SPOTLIGHT_COLOR = WHITE;
const DIFFUSE_MIN = 0.35; // brightness of a face turned away from the light (1 = facing it head-on)

// ---- Features (toggled from the controls) ----

const features = {
    hiddenSurfaceRemoval: false,
    fillPolygons: false,
    zorder: false,
    ambientShading: false,
    ambientLight: { ...WHITE },
    diffuseShading: false,
};

let body = TETRAHEDRON;
let worldTransform;
let viewTransform;
let polygons = [];

// ---- Geometry ----

function point(x, y, z, w = 1) {
    return { x, y, z, w };
}

function polygon3D(points, color) {
    const zsum = points.reduce((sum, p) => sum + p.z, 0);
    return { points, color, zorder: zsum / points.length };
}

function multiplyByVector(m, v) {
    return {
        x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z + m[0][3] * v.w,
        y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z + m[1][3] * v.w,
        z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z + m[2][3] * v.w,
        w: m[3][0] * v.x + m[3][1] * v.y + m[3][2] * v.z + m[3][3] * v.w,
    };
}

function multiplyByMatrix(a, b) {
    const result = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++)
            for (let k = 0; k < 4; k++)
                result[i][j] += a[i][k] * b[k][j];
    return result;
}

function crossProduct(v, w) {
    return point(v.y * w.z - v.z * w.y, v.z * w.x - v.x * w.z, v.x * w.y - v.y * w.x, v.w);
}

function dotProduct(v, w) {
    return v.x * w.x + v.y * w.y + v.z * w.z;
}

function unitNormal(polygon) {
    if (polygon.unitNormal) return polygon.unitNormal;
    const [first, second] = polygon.points;
    const last = polygon.points[polygon.points.length - 1];
    const v = point(second.x - first.x, second.y - first.y, second.z - first.z, first.w);
    const w = point(last.x - first.x, last.y - first.y, last.z - first.z, second.w);
    // w x v: the demo objects list each face's corners clockwise as seen from outside,
    // so this gives the outward normal (the original's v x w pointed inward)
    const n = crossProduct(w, v);
    const length = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
    n.x /= length;
    n.y /= length;
    n.z /= length;
    return polygon.unitNormal = n;
}

// A face is visible when its outward normal points towards the camera (at the origin).
// Testing against the actual camera position, not just the normal's z, keeps it right under perspective.
function isVisible(polygon) {
    const n = unitNormal(polygon);
    const p = polygon.points[0];
    return dotProduct(n, p) < 0;
}

// ---- Rotations: rotate the world transform around the view's axes ----

function appendRotationX(angle) {
    const cos = Math.cos(angle), sin = Math.sin(angle), t = worldTransform;
    for (let j = 0; j < 3; j++) {
        const t1 = cos * t[1][j] - sin * t[2][j];
        const t2 = sin * t[1][j] + cos * t[2][j];
        t[1][j] = t1;
        t[2][j] = t2;
    }
}

function appendRotationY(angle) {
    const cos = Math.cos(angle), sin = Math.sin(angle), t = worldTransform;
    for (let j = 0; j < 3; j++) {
        const t0 =  cos * t[0][j] + sin * t[2][j];
        const t2 = -sin * t[0][j] + cos * t[2][j];
        t[0][j] = t0;
        t[2][j] = t2;
    }
}

function appendRotationZ(angle) {
    const cos = Math.cos(angle), sin = Math.sin(angle), t = worldTransform;
    for (let j = 0; j < 3; j++) {
        const t0 = cos * t[0][j] - sin * t[1][j];
        const t1 = sin * t[0][j] + cos * t[1][j];
        t[0][j] = t0;
        t[1][j] = t1;
    }
}

// ---- Shading ----

function applyAmbientShading(color, ambient) {
    return {
        r: Math.round(color.r * ambient.r / 255),
        g: Math.round(color.g * ambient.g / 255),
        b: Math.round(color.b * ambient.b / 255),
    };
}

function applyDiffuseShading(color, lightPosition, lightColor, normal, facePoint) {
    const toLight = point(lightPosition.x - facePoint.x, lightPosition.y - facePoint.y, lightPosition.z - facePoint.z);
    const facing = Math.max(0, dotProduct(toLight, normal) / Math.sqrt(dotProduct(toLight, toLight)));
    // scale the colour rather than adding white to it, so every face keeps its own hue
    const brightness = DIFFUSE_MIN + (1 - DIFFUSE_MIN) * facing;
    return {
        r: Math.round(color.r * lightColor.r / 255 * brightness),
        g: Math.round(color.g * lightColor.g / 255 * brightness),
        b: Math.round(color.b * lightColor.b / 255 * brightness),
    };
}

// ---- Demo objects ----

function setupTetrahedron() {
    const v = [
        point(-20, -20,   0),
        point(  0,  30,   0),
        point( 30, -20,   0),
        point(  0,   0, -25),
    ];
    const face = (i, j, k, c) => polygons.push(polygon3D([v[i], v[j], v[k]], c));
    face(0, 1, 2, CYAN);
    face(2, 1, 3, MAGENTA);
    face(2, 3, 0, RED);
    face(3, 1, 0, GREEN);
}

function setupCube() {
    const v = [
        point( 15,  15,  15),
        point( 15,  15, -15),
        point( 15, -15,  15),
        point( 15, -15, -15),
        point(-15,  15,  15),
        point(-15,  15, -15),
        point(-15, -15,  15),
        point(-15, -15, -15),
    ];
    const face = (i, j, k, l, c) => polygons.push(polygon3D([v[i], v[j], v[k], v[l]], c));
    face(1, 3, 2, 0, CYAN);
    face(5, 7, 3, 1, MAGENTA);
    face(4, 5, 1, 0, RED);
    face(3, 7, 6, 2, GREEN);
    face(5, 4, 6, 7, BLUE);
    face(0, 2, 6, 4, YELLOW);
}

// ---- Pipeline ----

function setupInitialTransformations() {
    worldTransform = [
        [1, 0, 0,    0],
        [0, 1, 0,    0],
        [0, 0, 1, -CAMERA_DISTANCE], // away down the Z axis
        [1, 0, 0,    1],
    ];
    viewTransform = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [1, 0, 0, 1],
    ];
}

function initStuff() {
    polygons = [];
    setupInitialTransformations();
    if (body === TETRAHEDRON) setupTetrahedron();
    else if (body === CUBE) setupCube();
    draw();
}

function project(pt) {
    return {
        x: Math.round( pt.x / pt.z * P_RATIO * H / 2 + 0.5 + W / 2),
        y: Math.round(-pt.y / pt.z * P_RATIO * H / 2 + 0.5 + H / 2),
    };
}

function centroid(points) {
    const c = point(0, 0, 0);
    for (const p of points) {
        c.x += p.x / points.length;
        c.y += p.y / points.length;
        c.z += p.z / points.length;
    }
    return c;
}

function transformAndProjectPolygons(t) {
    const polygonsToDraw = [];

    for (const p of polygons) {
        // transform the 3D points to the view space, then project them to the screen:
        // same scale on both axes (no stretch), and y negated because screen y points down
        const transformedPoints = p.points.map(pt => multiplyByVector(t, pt));
        const projectedPoints = transformedPoints.map(project);

        const transformedP = polygon3D(transformedPoints, p.color);
        const projectedP = {
            points: projectedPoints,
            color: p.color,
            zorder: transformedP.zorder,
        };

        if (!features.hiddenSurfaceRemoval || isVisible(transformedP)) {
            polygonsToDraw.push(projectedP);
        }

        if (features.ambientShading) {
            projectedP.color = applyAmbientShading(p.color, features.ambientLight);
        }
        if (features.diffuseShading) {
            projectedP.color = applyDiffuseShading(projectedP.color, SPOTLIGHT_POSITION, SPOTLIGHT_COLOR,
                unitNormal(transformedP), centroid(transformedPoints));
        }
    }

    // painter's algorithm: furthest (most negative z) first
    if (features.zorder) {
        polygonsToDraw.sort((a, b) => a.zorder - b.zorder);
    }
    return polygonsToDraw;
}

// ---- Drawing ----

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
canvas.width = W;
canvas.height = H;

function draw() {
    const t = multiplyByMatrix(viewTransform, worldTransform);
    const polygonsToDraw = transformAndProjectPolygons(t);

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);

    const light = project(SPOTLIGHT_POSITION);
    if (features.diffuseShading) {
        // dashed ray from the light to the object's centre, under the object
        const centre = project(multiplyByVector(t, point(0, 0, 0)));
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = "#e0b000";
        ctx.beginPath();
        ctx.moveTo(light.x, light.y);
        ctx.lineTo(centre.x, centre.y);
        ctx.stroke();
        ctx.restore();
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000";

    for (const p of polygonsToDraw) {
        ctx.beginPath();
        for (const pt of p.points) ctx.lineTo(pt.x + 0.5, pt.y + 0.5);
        ctx.closePath();
        if (features.fillPolygons) {
            const { r, g, b } = p.color;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fill();
            // thin edge, so faces stay apart even when coloured ambient light makes them the same colour:
            // darker than the face, or lighter when the face is too dark for a darker edge to show
            const edge = 0.299 * r + 0.587 * g + 0.114 * b < 60
                ? c => Math.round(c + (255 - c) * 0.35)
                : c => Math.round(c * 0.6);
            ctx.strokeStyle = `rgb(${edge(r)}, ${edge(g)}, ${edge(b)})`;
            ctx.stroke();
        } else {
            ctx.stroke();
        }
    }

    if (features.diffuseShading) drawSun(light.x, light.y);
}

function drawSun(x, y) {
    ctx.save();
    ctx.strokeStyle = "#e0b000";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(x + 14 * Math.cos(a), y + 14 * Math.sin(a));
        ctx.lineTo(x + 22 * Math.cos(a), y + 22 * Math.sin(a));
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffd200";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#806000";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("light", x + 26, y + 4);
    ctx.restore();
}

// ---- Keyboard ----

const KEYS = {
    // translation
    ArrowUp:    () => { if (worldTransform[1][3] <  XY_CLIP) worldTransform[1][3] += TRANSLATION_STEP; },
    ArrowDown:  () => { if (worldTransform[1][3] > -XY_CLIP) worldTransform[1][3] -= TRANSLATION_STEP; },
    ArrowRight: () => { if (worldTransform[0][3] <  XY_CLIP) worldTransform[0][3] += TRANSLATION_STEP; },
    ArrowLeft:  () => { if (worldTransform[0][3] > -XY_CLIP) worldTransform[0][3] -= TRANSLATION_STEP; },

    // zoom
    PageUp:   () => { worldTransform[2][3] -= ZOOM_STEP; },                                    // zoom away
    PageDown: () => { if (worldTransform[2][3] < Z_CLIP) worldTransform[2][3] += ZOOM_STEP; }, // zoom in

    // rotations
    o: () => appendRotationY(-ROTATION_STEP),
    p: () => appendRotationY( ROTATION_STEP),
    a: () => appendRotationX( ROTATION_STEP),
    q: () => appendRotationX(-ROTATION_STEP),
    w: () => appendRotationZ( ROTATION_STEP),
    s: () => appendRotationZ(-ROTATION_STEP),
};

window.addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return; // leave browser shortcuts (Cmd+W, Cmd+Q, ...) alone
    const action = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!action) return;
    e.preventDefault(); // don't scroll the page or change a focused dropdown
    action();
    draw();
});

// ---- Controls ----

const $ = id => document.getElementById(id);

$("body").addEventListener("change", e => {
    body = Number(e.target.value);
    initStuff();
});

for (const [id, feature] of [
    ["hsr", "hiddenSurfaceRemoval"],
    ["fill", "fillPolygons"],
    ["zorder", "zorder"],
    ["ambient", "ambientShading"],
]) {
    $(id).addEventListener("change", e => {
        features[feature] = e.target.checked;
        draw();
    });
}

for (const channel of ["r", "g", "b"]) {
    $("ambient-" + channel).addEventListener("change", e => {
        features.ambientLight[channel] = Number(e.target.value) * 51;
        draw();
    });
}

$("diffuse").addEventListener("change", e => {
    features.diffuseShading = e.target.checked;
    if (features.diffuseShading) {
        $("fill").checked = true;
        features.fillPolygons = true;
    }
    draw();
});

initStuff();
