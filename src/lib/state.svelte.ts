import { Tool } from "./Enums";
import type { Point } from "./Point";
import { PointManager } from "./Point";
import { Vector, VectorManager } from "./Vector";

export class Toolbar {
	selectedTool: Tool = $state(Tool.Select);
}

export class SceneState {
	constructor(
		public readonly PointManager: PointManager,
		public readonly VectorManager: VectorManager,
	) {}

	public insertPointIntoVector(
		vector: Vector,
		x: number,
		y: number,
	): Point {
		const point = this.PointManager.addPoint(x, y);
		this.VectorManager.removeVector(vector);
		this.VectorManager.addVector(vector.from, point);
		this.VectorManager.addVector(point, vector.to);
		return point;
	}

	public removePoint(point: Point): void {
		const connectedVectors = this.VectorManager.getVectors().filter(
			(vector) => vector.from === point || vector.to === point,
		);
		let replacement: { from: Point; to: Point } | null = null;

		if (connectedVectors.length === 2) {
			const incoming = connectedVectors.find((vector) => vector.to === point);
			const outgoing = connectedVectors.find((vector) => vector.from === point);
			if (incoming && outgoing && incoming.from !== outgoing.to) {
				replacement = { from: incoming.from, to: outgoing.to };
			}
		}

		for (const vector of connectedVectors) {
			this.VectorManager.removeVector(vector);
		}
		this.PointManager.removePoint(point);

		if (
			replacement &&
			!this.VectorManager
				.getVectors()
				.some(
					(vector) =>
						vector.from === replacement?.from &&
						vector.to === replacement?.to,
				)
		) {
			this.VectorManager.addVector(replacement.from, replacement.to);
		}
	}
}
