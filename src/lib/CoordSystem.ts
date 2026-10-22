import * as THREE from 'three';

export class CoordSystem {
	private readonly gridGeometry = new THREE.BufferGeometry();
	private readonly gridMaterial = new THREE.LineBasicMaterial({
		color: 0x444444,
	});
	private readonly gridLines = new THREE.LineSegments(
		this.gridGeometry,
		this.gridMaterial,
	);

	private readonly xAxisGeometry = new THREE.BufferGeometry();
	private readonly xAxisMaterial = new THREE.LineBasicMaterial({
        color: 0xff0000
    });
	private readonly xAxisLines = new THREE.LineSegments(
		this.xAxisGeometry,
		this.xAxisMaterial,
	);

    private readonly yAxisGeometry = new THREE.BufferGeometry();
    private readonly yAxisMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
    });
    private readonly yAxisLines = new THREE.LineSegments(
        this.yAxisGeometry,
        this.yAxisMaterial,
    );

	private readonly labelGroup = new THREE.Group();

	private readonly textureCache = new Map<string, THREE.Texture>();
	private readonly spritePool: THREE.Sprite[] = [];
	private activeSpriteCount = 0;

	constructor(
		private readonly scene: THREE.Scene,
		private readonly camera: THREE.OrthographicCamera,
	) {
		scene.add(this.gridLines);
		scene.add(this.xAxisLines);
        scene.add(this.yAxisLines);
		scene.add(this.labelGroup);
	}

	private getLabelTexture(text: string): THREE.Texture {
		if (this.textureCache.has(text)) return this.textureCache.get(text);

		const canvas = document.createElement("canvas");
		canvas.width = 128;
		canvas.height = 64;
		const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("Failed to get 2D context for label texture.");

		ctx.fillStyle = "#000";
		ctx.font = "Bold 28px monospace";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(text, 64, 32);

		const texture = new THREE.CanvasTexture(canvas);
		this.textureCache.set(text, texture);
		return texture;
	}

	private getSprite() {
		if (this.activeSpriteCount < this.spritePool.length) {
			const sprite = this.spritePool[this.activeSpriteCount++];
			sprite.visible = true;
			return sprite;
		}
		const mat = new THREE.SpriteMaterial({
			depthTest: false,
			transparent: true,
		});
		const sprite = new THREE.Sprite(mat);
		this.labelGroup.add(sprite);
		this.spritePool.push(sprite);
		this.activeSpriteCount++;
		return sprite;
	}

	private resetSpritePool() {
		for (const element of this.spritePool) {
			element.visible = false;
		}
		this.activeSpriteCount = 0;
	}

	private calculateGridStep(visibleSpan: number): number {
		const rawStep = visibleSpan / 10;
		const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
		const normalizedStep = rawStep / magnitude;

		if (normalizedStep < 2) return magnitude;
		if (normalizedStep < 5) return 2 * magnitude;
		return 5 * magnitude;
	}

	public update() {
		const worldWidth =
			(this.camera.right - this.camera.left) / this.camera.zoom;
		const worldHeight =
			(this.camera.top - this.camera.bottom) / this.camera.zoom;

		const xMin = this.camera.position.x - worldWidth / 2;
		const xMax = this.camera.position.x + worldWidth / 2;
		const yMin = this.camera.position.y - worldHeight / 2;
		const yMax = this.camera.position.y + worldHeight / 2;

		const step = this.calculateGridStep(worldHeight);

		const gridVertices: number[] = [];

		const startX = Math.floor(xMin / step) * step;
		const endX = Math.ceil(xMax / step) * step;
		const startY = Math.floor(yMin / step) * step;
		const endY = Math.ceil(yMax / step) * step;

        this.resetSpritePool();

        const spriteScaleX = 0.05 * worldWidth;
        const spriteScaleY = 0.05 * worldHeight;

        const labelY =
					Math.max(
						yMin + spriteScaleY * 0.8,
						Math.min(yMax - spriteScaleY * 0.8, 0),
					) -
					spriteScaleY * 0.25;
		const labelX =
					Math.max(
						xMin + spriteScaleX * 0.8,
						Math.min(xMax - spriteScaleX * 0.8, 0),
					) +
					spriteScaleX * 0.25;

		for (let x = startX; x <= endX; x += step) {
			if (Math.abs(x) < 1e-6) continue;

			gridVertices.push(x, yMin, 0, x, yMax, 0);

            const sprite = this.getSprite();
            sprite.material.map = this.getLabelTexture(Number(x.toFixed(4)).toString());
            sprite.position.set(x, labelY, 0);
            sprite.scale.set(spriteScaleX, spriteScaleY, 1);
		}

		for (let y = startY; y <= endY; y += step) {
			if (Math.abs(y) < 1e-6) continue;

			gridVertices.push(xMin, y, 0, xMax, y, 0);

            const sprite = this.getSprite();
            sprite.material.map = this.getLabelTexture(Number(y.toFixed(4)).toString());
            sprite.position.set(labelX, y, 0);
            sprite.scale.set(spriteScaleX, spriteScaleY, 1);
		}

        const originSprite = this.getSprite();
        originSprite.material.map = this.getLabelTexture("0");
        originSprite.position.set(labelX, labelY, 0);
        originSprite.scale.set(spriteScaleX, spriteScaleY, 1);

		this.gridGeometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(gridVertices, 3),
		);
        this.xAxisGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute([xMin, 0, 0, xMax, 0, 0], 3),
        );
        this.yAxisGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute([0, yMin, 0, 0, yMax, 0], 3),
        );
	}

	public dispose() {
		this.gridGeometry.dispose();
		this.gridMaterial.dispose();
		this.xAxisGeometry.dispose();
        this.xAxisMaterial.dispose();
        this.yAxisGeometry.dispose();
        this.yAxisMaterial.dispose();
        this.labelGroup.children.forEach((sprite) => {
            const material = (sprite as THREE.Sprite).material as THREE.SpriteMaterial;
            material.map?.dispose();
            material.dispose();
        });
	}
}