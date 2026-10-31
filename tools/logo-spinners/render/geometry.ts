export type Vec3 = [number, number, number];

export const dot = (a: Vec3, b: Vec3) =>
	a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const cross = (a: Vec3, b: Vec3): Vec3 => [
	a[1] * b[2] - a[2] * b[1],
	a[2] * b[0] - a[0] * b[2],
	a[0] * b[1] - a[1] * b[0],
];

export const scale = (a: Vec3, k: number): Vec3 => [
	a[0] * k,
	a[1] * k,
	a[2] * k,
];

export const add = (...vs: Vec3[]): Vec3 =>
	vs.reduce<Vec3>((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]], [0, 0, 0]);

export const normalize = (a: Vec3) => scale(a, 1 / Math.hypot(...a));

// Rodrigues rotation of v around unit axis k by angle th
export const rotate = (v: Vec3, k: Vec3, th: number): Vec3 =>
	add(
		scale(v, Math.cos(th)),
		scale(cross(k, v), Math.sin(th)),
		scale(k, dot(k, v) * (1 - Math.cos(th))),
	);

// Multiply by a rotation matrix given as rows
export const applyMatrix = (m: readonly Vec3[], v: Vec3): Vec3 => [
	dot(m[0]!, v),
	dot(m[1]!, v),
	dot(m[2]!, v),
];
