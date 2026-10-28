import type { Viewport } from "./Viewport";
import * as THREE from "three";

export class Point {
	private readonly listeners = new Set<(point: Point) => void>();

	constructor(
		public readonly index: number,
		private _x: number,
		private _y: number,
		public readonly mesh: THREE.Mesh,
	) {}

	public subscribe(listener: (point: Point) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		for (const listener of this.listeners) {
			listener(this);
		}
	}

	public get x(): number {
		return this._x;
	}

	public set x(value: number) {
		this._x = value;
		this.notify();
	}

	public get y(): number {
		return this._y;
	}

	public set y(value: number) {
		this._y = value;
		this.notify();
	}

	public setPosition(x: number, y: number): void {
		this._x = x;
		this._y = y;
		this.notify();
	}
}

export class PointManager {
	private readonly points: Point[] = [];
	private readonly pointGeometry = new THREE.CircleGeometry(0.05);
	private readonly pointMaterial = new THREE.MeshBasicMaterial({
		color: 0xff0000,
	});

	constructor(
		private readonly scene: THREE.Scene,
		private readonly viewport: Viewport,
	) {}

	public addPoint(x: number, y: number): Point {
		const index = this.points.length;
		const pointMesh = new THREE.Mesh(this.pointGeometry, this.pointMaterial);
		pointMesh.position.set(x, y, 2);
		pointMesh.renderOrder = 10;
		this.scene.add(pointMesh);

		const point = new Point(index, x, y, pointMesh);
		point.subscribe(this.onPointChanged);
		this.points.push(point);

		return point;
	}

	public removePoint(point: Point): void {
		const index = this.points.indexOf(point);
		if (index === -1) {
			return;
		}

		this.scene.remove(point.mesh);
		this.points.splice(index, 1);
		this.viewport.render();
	}

	public getPoints(): Point[] {
		return this.points;
	}

	private readonly onPointChanged = (point: Point): void => {
		point.mesh.position.set(point.x, point.y, 2);
		this.viewport.render();
	};

	public getPointMeshes(): THREE.Mesh[] {
		return this.points.map((point) => point.mesh);
	}

	public getPointByMesh(mesh: THREE.Object3D): Point | null {
		return this.points.find((point) => point.mesh === mesh) ?? null;
	}
}
