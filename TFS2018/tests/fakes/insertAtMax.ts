import * as path from "path";
import * as tmrm from "azure-pipelines-task-lib/mock-run";

let taskPath: string = path.join(__dirname, "mockTask.js");
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);
let testFilePath: string = path.join(__dirname, "..", "_files", "AssemblyInfo65535.cs");

tmr.setInput("testMode", "insert");
tmr.setInput("testFilePath", testFilePath);
tmr.setInput("revision", "65535");

tmr.run();