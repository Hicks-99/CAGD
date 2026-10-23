import * as THREE from "three";

export class Viewport {
	constructor(
		private readonly canvas: HTMLCanvasElement,
		private readonly scene: THREE.Scene,
		public readonly camera: THREE.OrthographicCamera,
		private readonly renderer: THREE.WebGLRenderer,
	) {
		canvas.addEventListener("pointerdown", this.onPointerDown);
		canvas.addEventListener("pointermove", this.onPointerMove);
		canvas.addEventListener("pointerup", this.onPointerUp);
		canvas.addEventListener("pointercancel", this.onPointerUp);
		canvas.addEventListener("wheel", this.onWheel, { passive: false });
	}

	private isDragging = false;
	private prevPointer = { x: 0, y: 0 };
	private readonly allowedMouseButtons = new Set([0, 1, 2]);
	private readonly renderLoopCallbacks: Array<() => void> = [];

	public addToRenderLoop(renderLoop: () => void): void {
		this.renderLoopCallbacks.push(renderLoop);
	}

	public render(): void {
		for (const callback of this.renderLoopCallbacks) {
			callback();
		}
		this.renderer.render(this.scene, this.camera);
	}

	public disableLeftClick(): void {
		this.allowedMouseButtons.delete(0);
	}

	public enableLeftClick(): void {
		this.allowedMouseButtons.add(0);
	}

	private readonly onPointerDown = (event: PointerEvent): void => {
		if (!this.allowedMouseButtons.has(event.button)) {
			return;
		}

		this.isDragging = true;
		this.prevPointer = { x: event.clientX, y: event.clientY };
		if (this.canvas.setPointerCapture) {
			this.canvas.setPointerCapture(event.pointerId);
		}
	};

	private readonly onPointerMove = (event: PointerEvent): void => {
		if (!this.isDragging) {
			return;
		}

		const deltaX = event.clientX - this.prevPointer.x;
		const deltaY = event.clientY - this.prevPointer.y;

		const worldWidth =
			(this.camera.right - this.camera.left) / this.camera.zoom;
		const worldHeight =
			(this.camera.top - this.camera.bottom) / this.camera.zoom;

		this.camera.position.x -= (deltaX / this.canvas.width) * worldWidth;
		this.camera.position.y += (deltaY / this.canvas.height) * worldHeight;

		this.prevPointer = { x: event.clientX, y: event.clientY };
		this.render();
	};

	private readonly onPointerUp = (event: PointerEvent): void => {
		this.isDragging = false;
		if (this.canvas.hasPointerCapture(event.pointerId)) {
			this.canvas.releasePointerCapture(event.pointerId);
		}
	};

	private readonly onWheel = (event: WheelEvent): void => {
		event.preventDefault();
		const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;

		this.camera.zoom = Math.min(
			Math.max(this.camera.zoom * zoomFactor, 0.1),
			10,
		);

		this.camera.updateProjectionMatrix();
		this.render();
	};

	public dispose(): void {
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		this.canvas.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.removeEventListener("pointerup", this.onPointerUp);
		this.canvas.removeEventListener("pointercancel", this.onPointerUp);
		this.canvas.removeEventListener("wheel", this.onWheel);
		this.renderer.dispose();
	}
}
