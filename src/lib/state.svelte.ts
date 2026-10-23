import { Tool } from "./Enums";
import { PointManager } from "./Point";
import { VectorManager } from "./Vector";

export class Toolbar {
	selectedTool: Tool = $state(Tool.Select);
}

export class SceneState {
	constructor(
		public readonly PointManager: PointManager,
		public readonly VectorManager: VectorManager,
	) {}
}
