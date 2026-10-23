<script lang="ts">
	import { onMount } from "svelte";
	import * as THREE from "three";
	import { getContext } from "svelte";
	import { Viewport } from "../Viewport";
	import { CoordSystem } from "../CoordSystem";
	import { Tools } from "../tools.svelte.ts";
	import { type Toolbar, SceneState } from "../state.svelte.ts";
	import { PointManager } from "../Point";
	import { VectorManager } from "../Vector";

	let { polygon }: { polygon: THREE.Vector2[] | null } = $props();
	const toolbar: Toolbar = getContext("toolbar");
	let sceneState: SceneState | null = null;
	let isInitialized = $state(false);

	let canvasRef!: HTMLCanvasElement;
	let canvasWidth = $state(0);
	let canvasHeight = $state(0);
	let canvasAspect = $derived.by(() => {
		if (canvasHeight === 0) {
			return 1;
		}
		return canvasWidth / canvasHeight;
	});

	const frustumSize = 10;

	let scene: THREE.Scene;
	let camera: THREE.OrthographicCamera;
	let renderer: THREE.WebGLRenderer;
	let viewport: Viewport | null = $state(null);

	onMount(() => {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0xffffff);
		camera = new THREE.OrthographicCamera(
			(-frustumSize * canvasAspect) / 2,
			(frustumSize * canvasAspect) / 2,
			frustumSize / 2,
			-frustumSize / 2,
			0.1,
			1000,
		);
		camera.position.z = 3;

		renderer = new THREE.WebGLRenderer({ canvas: canvasRef, antialias: true });
		renderer.setSize(canvasWidth, canvasHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		viewport = new Viewport(canvasRef, scene, camera, renderer);

		const coordSystem = new CoordSystem(scene, camera, canvasRef);
		viewport.addToRenderLoop(() => coordSystem.update());

		const pointManager = new PointManager(scene, viewport);
		const vectorManager = new VectorManager(scene, viewport);
		sceneState = new SceneState(pointManager, vectorManager);

		new Tools(canvasRef, scene, viewport, toolbar, sceneState);
		isInitialized = true;
		viewport.render();

		return () => {
			coordSystem.dispose();
			viewport?.dispose();
		};
	});

	$effect(() => {
		if (
			!isInitialized ||
			!polygon ||
			!sceneState ||
			!scene ||
			!camera ||
			!viewport
		) {
			return;
		}

		const pointManager = sceneState.PointManager;
		const vectorManager = sceneState.VectorManager;
		const importedPoints = polygon.map((point) =>
			pointManager.addPoint(point.x, point.y),
		);
		const importedVectors = importedPoints.map((point, index) =>
			vectorManager.addVector(
				point,
				importedPoints[(index + 1) % importedPoints.length],
			),
		);

		const bounds = new THREE.Box2().setFromPoints(polygon);
		const size = bounds.getSize(new THREE.Vector2());
		const center = bounds.getCenter(new THREE.Vector2());
		const width = Math.max(size.x, Number.EPSILON);
		const height = Math.max(size.y, Number.EPSILON);
		camera.position.x = center.x;
		camera.position.y = center.y;
		camera.zoom = Math.min(
			(camera.right - camera.left) / (width * 1.2),
			(camera.top - camera.bottom) / (height * 1.2),
		);
		camera.updateProjectionMatrix();
		viewport.render();

		return () => {
			for (const vector of importedVectors) {
				vectorManager.removeVector(vector);
			}
			for (const point of importedPoints) {
				pointManager.removePoint(point);
			}
			viewport?.render();
		};
	});

	$effect(() => {
		if (!renderer || !camera) {
			return;
		}

		camera.left = (-frustumSize * canvasAspect) / 2;
		camera.right = (frustumSize * canvasAspect) / 2;
		camera.updateProjectionMatrix();
		renderer.setSize(canvasWidth, canvasHeight);
		renderer.render(scene, camera);
	});
</script>

<div bind:clientHeight={canvasHeight} bind:clientWidth={canvasWidth} class="canvas-container">
    <canvas bind:this={canvasRef}></canvas>
</div>

<style>
    .canvas-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: 8px;
    }

    canvas {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: block;
        cursor: grab;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
    }

    canvas:active {
        cursor: grabbing;
    }
</style>