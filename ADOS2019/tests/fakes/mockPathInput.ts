import * as tl from "azure-pipelines-task-lib/task";
import * as nu from "azure-devops-node-utilities";

async function run() {
	try {
		const isRequired: string | undefined = tl.getInput("IsRequired");
		const expectedFiles: string | undefined = tl.getVariable("ExpectedFiles");
		if (isRequired && expectedFiles) {
			let filesList: string[] = nu.getFilesListFromPathInput("TestPathInput", JSON.parse(isRequired));
			let actualFiles: number = filesList.length;
				if (actualFiles !== parseInt(expectedFiles)) {
					throw new Error(`Expected count did not match actual count. Expected: ${expectedFiles} Actual: ${actualFiles}`);
				}
		}
		else {
			throw new Error("IsRequired or ExpectedFiles were undefined.")
		}
	}
	catch (err) {
		tl.setResult(tl.TaskResult.Failed, err.message);
	}
}

run();