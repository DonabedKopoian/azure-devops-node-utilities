import * as vm from "azure-devops-node-api";
import * as tl from "azure-pipelines-task-lib/task";

/**
 * Gets the VSTS web API using predefined pipeline variables and OAUth access.
 * @returns The web API if no error occurred during connection.
 */
export async function getWebApi(): Promise<vm.WebApi> {
	return new Promise<vm.WebApi>(async (resolve) => {
		const tfcUri: string | undefined = tl.getVariable("System.TeamFoundationCollectionUri");
		const sat: string | undefined = tl.getVariable("System.AccessToken");
		if (tfcUri) {
			if (sat) {
				let vsts: vm.WebApi = vm.WebApi.createWithBearerToken(
					tfcUri, sat, { ignoreSslError: true }
				);
				resolve(vsts);
			}
			else {
				throw new Error("System.AccessToken returned undefined.");
			}
		}
		else {
			throw new Error("System.TeamFoundationCollectionUri returned undefined.");
		}
	});
}

/**
 * Gets the file extension from the given full file path.
 * @param fullFilePath The file path to parse the extension from.
 * @returns The file extension with the period, or undefined if no extension is found.
 */
export function getFileExtension(fullFilePath: string): string | undefined {
	const matchArray: RegExpMatchArray | null = fullFilePath.match(new RegExp(/[.][^.]+$/, "gm"));
	if (matchArray) {
		// We should only have one match if we have one, so return the first element
		return matchArray[0];
	}
	return undefined;
}

/**
 * Gets a list of files from a semi-colon deliniated set of paths which allow for
 * multiple inclusions with interleaved exclusions.
 * @param pathInputVariableName The path input variable name from the task to use as the multi-include/exclude string.
 * @param isRequired True if the path input is required.
 * @returns An array containing all files found in the given path input.  Empty array issues warning if the variable is required.
 * @throws Errors if any of the files in the list are directories, or if the given path input is undefined or null.
 *		   Only occurs if isRequired is true.
 */
export function getFilesListFromPathInput(pathInputVariableName: string, isRequired: boolean): string[] {
	let retList: string[] = [];
	const pathInput: string | undefined = tl.getPathInput(pathInputVariableName, isRequired);
	if (pathInput) {
		const findOptions: tl.FindOptions = <tl.FindOptions>{};
		const matchOptions: tl.MatchOptions = <tl.MatchOptions>{};
		const searchPatterns: string[] = pathInput.split(";").map(x => x.trim()).filter(x => !!x);
		retList = tl.findMatch("", searchPatterns, findOptions, matchOptions);
		retList.forEach((filePath) => {
			if (tl.stats(filePath).isDirectory()) {
				throw new Error(`"${filePath}" is a directory.`);
			}
		});
	}
	if (retList.length === 0 && isRequired) {
		tl.warning(`No file paths were found with the given search string: "${pathInput}"`);
	}
	return retList;
}