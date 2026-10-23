import { Point } from "./Point";
import * as THREE from "three";
import type { Viewport } from "./Viewport";

export class Vector {
	private readonly arrow: THREE.ArrowHelper;
	private readonly unsubscribeFrom: () => void;
	private readonly unsubscribeTo: () => void;

	constructor(
		public from: Point,
		public to: Point,
		private readonly scene: THREE.Scene,
	) {
		this.arrow = new THREE.ArrowHelper(
			new THREE.Vector3(0, 1, 0),
			new THREE.Vector3(from.x, from.y, 0),
			0,
			0x0000ff,
			0.18,
			0.08,
		);
		this.arrow.position.z = 1;

		this.unsubscribeFrom = this.from.subscribe(() => this.update());
		this.unsubscribeTo = this.to.subscribe(() => this.update());

		this.scene.add(this.arrow);
		this.update();
	}

	public dispose(): void {
		this.scene.remove(this.arrow);
		this.unsubscribeFrom();
		this.unsubscribeTo();
	}

	public update(): void {
		const start = new THREE.Vector3(this.from.x, this.from.y, 0);
		const end = new THREE.Vector3(this.to.x, this.to.y, 0);
		const direction = end.clone().sub(start);
		const length = direction.length();

		this.arrow.position.copy(start);
		this.arrow.setDirection(
			direction.lengthSq() > 0
				? direction.normalize()
				: new THREE.Vector3(0, 1, 0),
		);
		this.arrow.setLength(length, 0.18, 0.08);
	}
}

export class VectorManager {
	private readonly vectors: Vector[] = [];

	constructor(
		private readonly scene: THREE.Scene,
		private readonly viewport: Viewport,
	) {}

	public addVector(from: Point, to: Point): Vector {
		const vector = new Vector(from, to, this.scene);
		this.vectors.push(vector);
		this.viewport.render();
		return vector;
	}

	public getVectors(): Vector[] {
		return this.vectors;
	}

	public removeVector(vector: Vector): void {
		const index = this.vectors.indexOf(vector);
		if (index === -1) {
			return;
		}

		vector.dispose();
		this.vectors.splice(index, 1);
		this.viewport.render();
	}
}
