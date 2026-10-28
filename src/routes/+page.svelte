<script lang="ts">
	import Canvas from "#lib/components/Canvas.svelte";
	import { getContext } from "svelte";
	import * as THREE from "three";
	import { parseFirstObjFace } from "../lib/ObjPolygon";
	import type { Toolbar } from "../lib/state.svelte.ts";
	import { Tool } from "../lib/Enums";

	const toolbar: Toolbar = getContext("toolbar");
	let importedFace: THREE.Vector2[] | null = $state(null);
	let importError = $state("");

	function handleImport(): void {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".obj";

		input.onchange = async (event: Event) => {
			const target = event.target as HTMLInputElement;
			if (!target.files || target.files.length === 0) {
				return;
			}

			try {
				importedFace = parseFirstObjFace(await target.files[0].text());
				importError = "";
			} catch (error) {
				importError =
					error instanceof Error ? error.message : "Die OBJ-Datei konnte nicht importiert werden.";
			}
		};

		input.click();
	}
</script>

<div class="container">
	<div class="nav-container">
		<nav>
			<div class="toolbar">
				<button
					onclick={() => (toolbar.selectedTool = Tool.Select)}
					class:active={toolbar.selectedTool === Tool.Select}
					aria-label="Select tool. Select a point and press Delete or Backspace to remove it."
					title="Select a point, then press Delete or Backspace to remove it"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M173.3 66.5C181.4 62.4 191.2 63.3 198.4 68.8L518.4 308.7C526.7 314.9 530 325.7 526.8 335.5C523.6 345.3 514.4 351.9 504 351.9L351.7 351.9L440.6 529.6C448.5 545.4 442.1 564.6 426.3 572.5C410.5 580.4 391.3 574 383.4 558.2L294.5 380.5L203.2 502.3C197 510.6 186.2 513.9 176.4 510.7C166.6 507.5 160 498.3 160 488L160 88C160 78.9 165.1 70.6 173.3 66.5z"/></svg>
				</button>
				<button
					onclick={() => (toolbar.selectedTool = Tool.Point)}
					class:active={toolbar.selectedTool === Tool.Point}
					aria-label="Point tool. Click a vector to insert a point into it, or click and drag to create a point."
					title="Click a vector to insert a point, or click and drag to create one"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM320 224C373 224 416 267 416 320C416 373 373 416 320 416C267 416 224 373 224 320C224 267 267 224 320 224z"/></svg>
				</button>
				<button
					onclick={() => (toolbar.selectedTool = Tool.Vector)}
					class="vector"
					class:active={toolbar.selectedTool === Tool.Vector}
					aria-label="Vector tool"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z"/></svg>
				</button>
			</div>
			<button onclick={handleImport} class="import-btn">Import</button>
		</nav>
		{#if importError}
			<p class="import-error" role="alert">{importError}</p>
		{/if}
	</div>
	<div class="canvas-container">
		<Canvas polygon={importedFace} />
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
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        border-radius: 8px;
        background: blue;
    }

	.import-error {
		margin: 0.5rem 0 0;
		color: #ff8080;
	}

    .canvas-container {
        padding: 0 0.5rem 0.5rem 0.5rem;
    }

    button {
        border: none;
        background: none;
        cursor: pointer;
        color: white;
        padding: 0.5rem;
        border-radius: 4px;
    }

    .toolbar {
        display: flex;
        gap: 0.5rem;
    }

    .toolbar button {
        height: 2rem;
        width: 2rem;
        fill: white;
    }

    .toolbar button.active {
        background: rgba(0, 0, 0, 0.5);
    }

    .vector svg {
        transform: rotate(-45deg);
    }
</style>
