import * as fs from "fs";
import * as path from "path";
import * as ma from "azure-pipelines-task-lib/mock-answer";
import * as tmrm from "azure-pipelines-task-lib/mock-run";

let taskPath: string = path.join(__dirname, "mockPathInput.js");
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);
let testFilePath: string = path.join(__dirname, "..", "_files");

tmr.setInput("TestPathInput", testFilePath);

// Set up the mock answers for specific calls in this run
tmr.setAnswers(<ma.TaskLibAnswers>{
	findMatch: {
		[testFilePath]: [testFilePath]
	},
	stats: {
		[testFilePath]: fs.statSync(testFilePath)
	}
});

tmr.run();