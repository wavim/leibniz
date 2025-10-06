import { createDefaultPreset } from "ts-jest";

/** @type {import("jest").Config} **/
export default {
	transform: createDefaultPreset().transform,
	testEnvironment: "node",
};
