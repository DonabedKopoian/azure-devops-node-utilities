import * as path from "path";
import * as tmrm from "azure-pipelines-task-lib/mock-run";

let taskPath: string = path.join(__dirname, "mockPathInput.js");
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput("IsRequired", "true");

tmr.run();