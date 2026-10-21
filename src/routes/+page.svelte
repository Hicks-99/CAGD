<script lang="ts">
    import { onMount } from 'svelte';
    import * as THREE from 'three';

    let canvasRef: HTMLCanvasElement;
    let canvasWidth = $state(0);
    let canvasHeight = $state(0);

    onMount(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef, antialias: true });
        renderer.setSize(canvasWidth, canvasHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        camera.position.z = 3;

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        };
        animate();
    })
</script>

<div class="container">
    <nav>
        <button>Import</button>
    </nav>
    <canvas bind:this={canvasRef} bind:clientHeight={canvasHeight} bind:clientWidth={canvasWidth}></canvas>
</div>

<style>
    .container {
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    canvas {
        width: 100%;
        height: 100%;
        display: block;
    }
</style>
