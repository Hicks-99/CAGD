import * as THREE from "three";

export class Viewport {
	constructor(
		private readonly canvas: HTMLCanvasElement,
		private readonly scene: THREE.Scene,
		private readonly camera: THREE.OrthographicCamera,
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

	public render() {
		this.renderer.render(this.scene, this.camera);
	}

	private onPointerDown = (event: PointerEvent) => {
		this.isDragging = true;
		this.prevPointer = { x: event.clientX, y: event.clientY };
		this.canvas.setPointerCapture(event.pointerId);
	}

	private onPointerMove = (event: PointerEvent) => {
		if (!this.isDragging) return;

		const deltaX = event.clientX - this.prevPointer.x;
		const deltaY = event.clientY - this.prevPointer.y;

		const worldWidth =
			(this.camera.right - this.camera.left) / this.camera.zoom;
		const worldHeight =
			(this.camera.top - this.camera.bottom) / this.camera.zoom;

		this.scene.position.x += (deltaX / this.canvas.width) * worldWidth;
		this.scene.position.y -= (deltaY / this.canvas.height) * worldHeight;

		this.prevPointer = { x: event.clientX, y: event.clientY };
		this.render();
	}

	private onPointerUp = (event: PointerEvent) => {
		this.isDragging = false;
		this.canvas.releasePointerCapture(event.pointerId);
	}

	private onWheel = (event: WheelEvent) => {
		event.preventDefault();
		const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;

		this.camera.zoom = Math.min(
			Math.max(this.camera.zoom * zoomFactor, 0.1),
			10,
		);

		this.camera.updateProjectionMatrix();
		this.render();
	}

	public dispose() {
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		this.canvas.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.removeEventListener("pointerup", this.onPointerUp);
		this.canvas.removeEventListener("pointercancel", this.onPointerUp);
		this.canvas.removeEventListener("wheel", this.onWheel);
        this.renderer.dispose();
	}
}