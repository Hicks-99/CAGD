import * as THREE from "three";

export function parseFirstObjFace(contents: string): THREE.Vector2[] {
	const vertices: THREE.Vector2[] = [];

	for (const [lineIndex, sourceLine] of contents.split(/\r?\n/).entries()) {
		const line = sourceLine.split("#", 1)[0].trim();
		if (line.length === 0) {
			continue;
		}

		const [record, ...values] = line.split(/\s+/);
		if (record === "v") {
			const x = Number(values[0]);
			const y = Number(values[1]);
			if (values.length < 2 || !Number.isFinite(x) || !Number.isFinite(y)) {
				throw new Error(`Ungültiger Vertex in Zeile ${lineIndex + 1}.`);
			}
			vertices.push(new THREE.Vector2(x, y));
		}

		if (record !== "f") {
			continue;
		}

		if (values.length < 3) {
			throw new Error(`Das Face in Zeile ${lineIndex + 1} hat weniger als drei Vertices.`);
		}

		return values.map((value) => {
			const indexToken = value.split("/")[0];
			if (!/^[+-]?\d+$/.test(indexToken)) {
				throw new Error(`Ungültiger Face-Index in Zeile ${lineIndex + 1}.`);
			}

			const index = Number(indexToken);
			const vertexIndex = index > 0 ? index - 1 : vertices.length + index;
			const vertex = vertices[vertexIndex];
			if (index === 0 || !vertex) {
				throw new Error(`Face-Index außerhalb des Vertex-Bereichs in Zeile ${lineIndex + 1}.`);
			}

			return vertex.clone();
		});
	}

	throw new Error("Die OBJ-Datei enthält kein Face.");
}
