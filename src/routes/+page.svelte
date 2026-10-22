<script lang="ts">
    import Canvas from '$comps/Canvas.svelte';
    import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

    function handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.obj';

        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                const file = target.files[0];
                const loader = new OBJLoader();
                const reader = new FileReader();
                
                reader.addEventListener('load', () => {
                    const contents = reader.result as string;
                    const object = loader.parse(contents);
                    console.log('Imported OBJ:', object);
                });
                
                reader.readAsText(file);
            }
        };

        input.click();
    }
</script>

<div class="container">
    <div class="nav-container">
        <nav>
            <button onclick={handleImport} class="import-btn">Import</button>
        </nav>
    </div>
    <div class="canvas-container">
        <Canvas />
    </div>
</div>

<style>
    .container {
        height: 100dvh;
        display: grid;
        grid-template-rows: auto 1fr;
        background: black;
    }

    .nav-container {
        padding: 0.5rem;
    }

    nav {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        border-radius: 8px;
        background: darkblue;
    }

    .canvas-container {
        padding: 0 0.5rem 0.5rem 0.5rem;
    }

    .import-btn {
        border: none;
        background: none;
        color: white;
        cursor: pointer;
        padding: 0.5rem
    }
</style>
