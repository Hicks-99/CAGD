import * as THREE from "three";
import type { Toolbar, SceneState } from "./state.svelte.ts";
import type { Viewport } from "./Viewport";
import { Tool } from "./Enums";
import { Point } from "./Point";

export class Tools {
	private pointTool: PointTool | null = null;
	private vectorTool: VectorTool | null = null;
	private selectTool: SelectTool | null = null;

	private activeTool: BaseTool | null = null;

	constructor(
		private readonly canvas: HTMLCanvasElement,
		private readonly scene: THREE.Scene,
		private readonly viewport: Viewport,
		private readonly toolbar: Toolbar,
		private readonly sceneState: SceneState,
	) {
		this.initializeTools();

		$effect(() => {
			const nextTool = (() => {
				switch (toolbar.selectedTool) {
					case Tool.Point:
						return this.pointTool;
					case Tool.Vector:
						return this.vectorTool;
					case Tool.Select:
						return this.selectTool;
					default:
						return null;
				}
			})();

			this.activeTool?.disable();
			this.activeTool = nextTool;
			this.activeTool?.enable();
		});
	}

	private initializeTools() {
		this.pointTool = new PointTool(
			this.canvas,
			this.scene,
			this.viewport,
			this.sceneState,
		);
		this.vectorTool = new VectorTool(
			this.canvas,
			this.scene,
			this.viewport,
			this.sceneState,
		);
		this.selectTool = new SelectTool(
			this.canvas,
			this.scene,
			this.viewport,
			this.sceneState,
		);
	}
}

abstract class BaseTool {
	protected isEnabled = false;

	constructor(
		protected readonly canvas: HTMLCanvasElement,
		protected readonly scene: THREE.Scene,
		protected readonly viewport: Viewport,
		protected readonly sceneState: SceneState,
	) {}

	abstract enable(): void;
	abstract disable(): void;
}

class SelectTool extends BaseTool {
	public enable() {}

	public disable() {}
}

class PointTool extends BaseTool {
	private currentPoint: Point | null = null;
	private hoveredPoint: Point | null = null;
	private readonly raycaster = new THREE.Raycaster();
	private static readonly hoverScale = 1.5;

	public enable() {
		this.viewport.disableLeftClick();
		this.canvas.addEventListener("pointerdown", this.onPointerDown);
		this.canvas.addEventListener("pointermove", this.onPointerMove);
		this.canvas.addEventListener("pointerup", this.onPointerUp);
		this.canvas.addEventListener("pointerleave", this.onPointerLeave);
	}

	public disable() {
		this.viewport.enableLeftClick();
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		this.canvas.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.removeEventListener("pointerup", this.onPointerUp);
		this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
		this.resetHoverState();
		this.currentPoint = null;
	}

	private readonly getNormalizedDeviceCoordinates = (
		event: PointerEvent,
	): THREE.Vector2 => {
		const rect = this.canvas.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		return new THREE.Vector2(x, y);
	};

	private readonly getWorldPosition = (event: PointerEvent): THREE.Vector3 => {
		const mouse = this.getNormalizedDeviceCoordinates(event);

		const worldPosition = new THREE.Vector3();
		worldPosition.set(mouse.x, mouse.y, 0);
		worldPosition.unproject(this.viewport.camera);

		return worldPosition;
	};

	private readonly getHoveredPoint = (event: PointerEvent) => {
		const mouse = this.getNormalizedDeviceCoordinates(event);
		this.raycaster.setFromCamera(mouse, this.viewport.camera);

		const intersects = this.raycaster.intersectObjects(
			this.sceneState.PointManager.getPointMeshes(),
			false,
		);

		if (intersects.length === 0) {
			return null;
		}

		return this.sceneState.PointManager.getPointByMesh(
			intersects[0].object as THREE.Mesh,
		);
	};

	private readonly resetHoverState = () => {
		if (this.hoveredPoint) {
			this.hoveredPoint.mesh.scale.setScalar(1);
			this.hoveredPoint = null;
			this.viewport.render();
		}
	};

	private readonly updateHoverState = (event: PointerEvent) => {
		const nextHoveredPoint = this.getHoveredPoint(event);

		if (nextHoveredPoint === this.hoveredPoint) {
			return;
		}

		this.resetHoverState();
		this.hoveredPoint = nextHoveredPoint;

		if (this.hoveredPoint) {
			this.hoveredPoint.mesh.scale.setScalar(PointTool.hoverScale);
			this.viewport.render();
		}
	};

	private readonly onPointerDown = (event: PointerEvent) => {
		if (event.button !== 0) return;

		if (this.hoveredPoint) {
			this.currentPoint = this.hoveredPoint;
			return;
		}

		const worldPos = this.getWorldPosition(event);
		this.currentPoint = this.sceneState.PointManager.addPoint(
			worldPos.x,
			worldPos.y,
		);
	};

	private readonly onPointerMove = (event: PointerEvent) => {
		if (!this.currentPoint) {
			this.updateHoverState(event);
			return;
		}

		const worldPos = this.getWorldPosition(event);
		this.currentPoint.setPosition(worldPos.x, worldPos.y);
	};

	private readonly onPointerUp = (event: PointerEvent) => {
		if (event.button !== 0 || !this.currentPoint) return;

		const worldPos = this.getWorldPosition(event);
		this.currentPoint.setPosition(worldPos.x, worldPos.y);
		this.currentPoint = null;
	};

	private readonly onPointerLeave = () => {
		this.resetHoverState();
	};
}

class VectorTool extends BaseTool {
	private draftFrom: Point | null = null;
	private draftArrow: THREE.ArrowHelper | null = null;
	private hoveredPoint: Point | null = null;
	private readonly raycaster = new THREE.Raycaster();
	private static readonly hoverScale = 1.5;

	public enable() {
		this.viewport.disableLeftClick();
		this.canvas.addEventListener("pointerdown", this.onPointerDown);
		this.canvas.addEventListener("pointermove", this.onPointerMove);
		this.canvas.addEventListener("pointerleave", this.onPointerLeave);
	}

	public disable() {
		this.viewport.enableLeftClick();
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		this.canvas.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
		this.resetHoverState();
		this.cancelDraft();
	}

	private readonly getNormalizedDeviceCoordinates = (
		event: PointerEvent,
	): THREE.Vector2 => {
		const rect = this.canvas.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		return new THREE.Vector2(x, y);
	};

	private readonly getWorldPosition = (event: PointerEvent): THREE.Vector3 => {
		const mouse = this.getNormalizedDeviceCoordinates(event);
		const worldPosition = new THREE.Vector3();
		worldPosition.set(mouse.x, mouse.y, 0);
		worldPosition.unproject(this.viewport.camera);
		return worldPosition;
	};

	private readonly getHoveredPoint = (event: PointerEvent) => {
		const mouse = this.getNormalizedDeviceCoordinates(event);
		this.raycaster.setFromCamera(mouse, this.viewport.camera);

		const intersects = this.raycaster.intersectObjects(
			this.sceneState.PointManager.getPointMeshes(),
			false,
		);

		if (intersects.length === 0) return null;
		return this.sceneState.PointManager.getPointByMesh(
			intersects[0].object as THREE.Mesh,
		);
	};

	private readonly resetHoverState = () => {
		if (this.hoveredPoint) {
			this.hoveredPoint.mesh.scale.setScalar(1);
			this.hoveredPoint = null;
			this.viewport.render();
		}
	};

	private readonly updateHoverState = (event: PointerEvent) => {
		const nextHoveredPoint = this.getHoveredPoint(event);
		if (nextHoveredPoint === this.hoveredPoint) return;

		this.resetHoverState();
		this.hoveredPoint = nextHoveredPoint;

		if (this.hoveredPoint) {
			this.hoveredPoint.mesh.scale.setScalar(VectorTool.hoverScale);
			this.viewport.render();
		}
	};

	private readonly cancelDraft = () => {
		if (this.draftArrow) {
			this.scene.remove(this.draftArrow);
			this.draftArrow = null;
		}
		this.draftFrom = null;
	};

	private readonly beginDraft = (fromPoint: Point) => {
		this.draftFrom = fromPoint;
		this.draftArrow = new THREE.ArrowHelper(
			new THREE.Vector3(0, 1, 0),
			new THREE.Vector3(fromPoint.x, fromPoint.y, 0),
			0,
			0x0000ff,
			0.18,
			0.08,
		);

		this.scene.add(this.draftArrow);
	};

	private readonly updateDraftArrow = (target: THREE.Vector3) => {
		if (!this.draftFrom || !this.draftArrow) return;

		const start = new THREE.Vector3(this.draftFrom.x, this.draftFrom.y, 0);
		const direction = target.clone().sub(start);
		const length = direction.length();

		this.draftArrow.position.copy(start);
		this.draftArrow.position.z = 1;

		this.draftArrow.setDirection(
			direction.lengthSq() > 0
				? direction.normalize()
				: new THREE.Vector3(0, 1, 0),
		);

		const headLength = Math.max(0.001, Math.min(length, 0.18));
		const headWidth = headLength * (0.08 / 0.18);

		this.draftArrow.setLength(Math.max(0.001, length), headLength, headWidth);
		this.viewport.render();
	};

	private readonly onPointerDown = (event: PointerEvent) => {
		if (event.button !== 0) return;

		const worldPos = this.getWorldPosition(event);
		const clickedPoint = this.getHoveredPoint(event);

		if (!this.draftFrom) {
			const fromPoint =
				clickedPoint ??
				this.sceneState.PointManager.addPoint(worldPos.x, worldPos.y);
			this.beginDraft(fromPoint);
			return;
		}

		const toPoint =
			clickedPoint ??
			this.sceneState.PointManager.addPoint(worldPos.x, worldPos.y);
		if (toPoint !== this.draftFrom) {
			this.sceneState.VectorManager.addVector(this.draftFrom, toPoint);
		}
		this.cancelDraft();
	};

	private readonly onPointerMove = (event: PointerEvent) => {
		this.updateHoverState(event);

		if (this.draftFrom) {
			const worldPos = this.getWorldPosition(event);
			this.updateDraftArrow(worldPos);
		}
	};

	private readonly onPointerLeave = () => {
		this.resetHoverState();
		this.cancelDraft();
	};
}
