<script lang="ts">
    import { onMount } from 'svelte';
    import * as THREE from 'three';
    import { Viewport } from '$lib/Viewport';

    let canvasRef: HTMLCanvasElement;
    let canvasWidth = $state(0);
    let canvasHeight = $state(0);
    let canvasAspect = $derived.by(() => {
        if (canvasHeight === 0) return 1;
        return canvasWidth / canvasHeight;
    });

    const fristumSize = 10;

    let scene: THREE.Scene;
    let camera: THREE.OrthographicCamera;
    let renderer: THREE.WebGLRenderer;
    let viewport: Viewport;

    onMount(() => {
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(
            (-fristumSize * canvasAspect) / 2,
            (fristumSize * canvasAspect) / 2,
            fristumSize / 2,
            -fristumSize / 2,
            0.1, 
            1000
        );
        renderer = new THREE.WebGLRenderer({ canvas: canvasRef, antialias: true });
        renderer.setSize(canvasWidth, canvasHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        viewport = new Viewport(canvasRef, scene, camera, renderer);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        camera.position.z = 3;

        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            viewport.render();
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            viewport.dispose();
            geometry.dispose();
            material.dispose();
        };
    })

    $effect(() => {
        if (!renderer || !camera) return;
        camera.left = (-fristumSize * canvasAspect) / 2;
        camera.right = (fristumSize * canvasAspect) / 2;
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
    }

    canvas:active {
        cursor: grabbing;
    }
</style>