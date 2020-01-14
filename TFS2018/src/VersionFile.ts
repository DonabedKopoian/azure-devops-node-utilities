import * as fs from "fs";
import * as tl from "azure-pipelines-task-lib/task";
import * as stream from "stream";

/**
 * Used to get the encoding string and code page number for a file's specific encryption type.
 */
export interface EncodingValues {
	/**
	 * The encoding as a string.
	 * Refer to valid encoding values for readFileSync() in fs.ts
	 */
	encoding: string,
	/**
	 * The code page as a number.
	 */
	codePage: number,
	/**
	 * The hex BOM values of the encoding.
	 * */
	bom: Buffer
}

/**
 * Used by unit tests to inject a fake stream.Readable. 
 */
export class ReadStreamFactory {
	/**
	 * Inserts a fake stream.Readable into the factory
	 * for return by getReadableStream(fullFilePath: string): stream.Readable.
	 * Note that fullFilePath will be igonored when this value is not undefined.
	 */
	public static fakeReadableStream: stream.Readable | undefined = undefined;
	/**
	 * Gets a stream.Readable off the given file path.
	 * This will only contain the first two bytes of the file data
	 * to determine if the UTF-16LE BOM exists in the file.
	 * If the fakeReadableStream attribute has been set (default = undefined),
	 * then that will be returned and the fullFilePath string will be ignored.
	 * @param fullFilePath The full file path of the data to read the first two bytes from.
	 */
	public static getReadableStream(fullFilePath: string): stream.Readable {
		if (ReadStreamFactory.fakeReadableStream) {
			return ReadStreamFactory.fakeReadableStream;
		}
		return fs.createReadStream(fullFilePath, { start: 0, end: 1 });
	}
}

/**
 * Gets the EncodingValues by readding in the BOM of a text file, if one exists.
 * Supports UTF-8 and UTF-16LE only.  All version files should decode with one of these two values.
 * @param fullFilePath The full file path of the version file to get the encoding values from.
 */
export async function getEncodingFromTextFileBom(fullFilePath: string): Promise<EncodingValues> {
	return new Promise((resolve) => {
		// Default is UTF-8
		var retVal: EncodingValues = <EncodingValues>{
			encoding: "utf8",
			codePage: 65001,
			bom: Buffer.from([0xEF, 0xBB, 0xBF])
		}
		var readStream: stream.Readable = ReadStreamFactory.getReadableStream(fullFilePath);
		readStream.on("data", (chunk) => {
			var utf16Bom: Buffer = Buffer.from([0xFF, 0xFE]);
			if (utf16Bom[0] == chunk[0] && utf16Bom[1] == chunk[1]) {
				retVal = <EncodingValues>{
					encoding: "utf16le",
					codePage: 1200,
					bom: utf16Bom
				}
			}
		});
		readStream.on("error", (err) => {
			throw err;
		});
		return readStream.on("end", () => {
			resolve(retVal);
		});
	});
}

/**
 * Checks the given revision value to validate legality.  Logs a warning if at the maximum allowable limit.
 * @param newRevision The new revision value to set.
 * @throws Error if the new revision is NAN, above ushort.Max, or below 0.
 */
export function checkRevision(newRevision: number): void {
	const maxUShort: number = 65535;
	// Check the new revision
	if (Number.isNaN(newRevision)) {
		throw new Error("Revision value is not a number.");
	}
	if (newRevision === maxUShort) {
		tl.warning("Revision value is at the maximum allowable limit.  Please address or the next build will fail.");
	}
	else if (newRevision > maxUShort) {
		throw new Error("Revision value exceeded maximum allowable limit.");
	}
	else if (newRevision < 0) {
		throw new Error("Revision value must be 0 or greater.");
	}
}

/**
 * Describes the components used to insert or increment the revision value
 * in a version control file without erroneously incrementing dependency version values.
 */
export interface IVersionFile {
	/**
	 * Contains an array of full paths to version files required for updating.
	 */
	readonly fullFilePaths: string[];
	/**
	 * Contains an array of regex expressions used for getting the
	 * precise line in the version file where the version is specified.
	 * To set up:
	 * (1) Use parameters "gm" in second argument of RegExp constructor to treat each line as an independent string.
	 * (2) Use an expression that covers the start of the line (^) to the end of the line ($), this prevents
	 *     the possibility that a dependency or unrelated version number is inadvertently changed.
	 * (3) Keep in mind the possibility that versions can be 3 or 4 digits, and can contain text on
	 *     either the 3rd or 4th, regardless if the version has 3 or 4 digits. Keep all legal values in mind. ex:
	 *     (a) 3.4.5-alpha.6 (.NET Standard/Core legal).
	 *     (b) 3.4.5-alpha (.NET Standard/Core legal).
	 *     (c) 1.6.0-SNAPSHOT (gradle legal).
	 *     (d) 1.6.0.4-SNAPSHOT (gradle legal).
	 * (4) RegExp grouping should follow these standards:
	 *	   (a) First group is everything up to but not including the first digit of the version.
	 *	   (b) Second group is the first digit of the version.
	 *	   (c) Third group is the delineator between the first and second digit of the version.
	 *	   (d) Fourth group is the second digit of the version.
	 *	   (e) Fifth group is the delineator between the second and third digit of the version.
	 *	   (f) Sixth group is the third digit of the version.
	 *	   (g) Seventh group is any non-digit text in the third digit of the version as well as
	 *		   the delineator between the third and fourth digit of the version (blank if fourth digit is not present).
	 *	   (h) Eighth group is the fourth digit of the version (check for empty to determine whether to change 3rd or 4th digit).
	 *	   (i) Ninth group is any non-digit text in the fourth digit of the version as well as
	 *	       everything up to the end of the line.
	 */
	readonly fullVersionExpressions: RegExp[];
	/**
	 * Inserts the revision into the given file paths.
	 * @param revision The number to use for the revision value.
	 * @returns True if the method succeeds.
	 */
	insertRevision(revision: number): Promise<boolean>;
	/**
	 * Increments the revision value found in the given file.
	 * @returns True if the method succeeds.
	 */
	incrementRevision(): Promise<boolean>;
	/**
	 * Gets the full version pulled from the first instance of a version in the first file in the list.
	 * @returns The full version, or throws an error if the version could not be parsed.
	 */
	getFullVersion(): Promise<string>;
}

/**
 * Used by unit tests as a mock object to inject a fake string.
 * Allows an assert against the generated output string.
 */
export class FileDataFactory {
	/**
	 * Inserts a fake string into the factory
	 * for return by getReadableStream(fullFilePath: string): stream.Readable.
	 * Note that fullFilePath and encoding will be ignored when this value is not undefined.
	 */
	public static fakeInput: string | undefined = undefined;
	/**
	 * Use the FileDataFactory as a mock to test the output generated from using fakeInput.
	 */
	public static generatedOutput: string | undefined = undefined;
	/**
	 * Gets the file data from the given file path as a string of
	 * the specified encoding.
	 * If the fakeInput attribute has been set (default = undefined),
	 * then that will be returned and the fullFilePath and encoding strings will be ignored.
	 * @param fullFilePath The full file path of the data to read from.
	 * @param encoding The encoding value to use for fs.ReadFileSync encoding.
	 */
	public static getFileData(fullFilePath: string, encoding: string): string {
		if (FileDataFactory.fakeInput) {
			return FileDataFactory.fakeInput;
		}
		return fs.readFileSync(fullFilePath, { encoding: encoding });
	}
	/**
	 * Saves the file data to the given file path using the given data as
	 * a string of the specified encoding.
	 * If the fakeInput attribute has been set (default = undefined),
	 * then the data will be assigned to generateOutput and the fullFilePath
	 * and encoding strings will be ignored.
	 * @param fullFilePath The full file path to write the data to.
	 * @param data The string data to write to file.
	 * @param encoding The encoding value to use for fs.WriteFileSync encoding.
	 */
	public static saveFileData(fullFilePath: string, data: string, encoding: string): void {
		if (FileDataFactory.fakeInput) {
			FileDataFactory.generatedOutput = data;
		}
		else {
			fs.writeFileSync(fullFilePath, data, { encoding: encoding });
		}
	}
}

/**
 * An abstract class used to inherit generic insertRevision and incrementRevision methods.
 * If the class has to modify multiple fields differently (i.e. a 3-digit alphanumeric version schema for
 * one part of the file and a 4-digit numeric version schema for different parts of the same file),
 * then the insertRevision and incrementRevision tasks will need to be overridden accordingly.
 * See the child class CsNetStandardCoreVersionFile as an example.
 */
class VersionFile implements IVersionFile {
	readonly fullFilePaths: string[];
	readonly fullVersionExpressions: RegExp[];
	readonly simpleVersionExpression: RegExp;
	readonly unwantedVersionDelineators: RegExp;

	/**
	 * Instantiate your child class with the full file paths of the files to change,
	 * the full version expression, the revision expressions, and the encoding to use.
	 * @param fullFilePaths An array containing all full file paths to the files to modify.
	 * @param fullVersionExpressions An array containing the different expressions used to grab the version portions of the file.
	 */
	constructor(fullFilePaths: string[], fullVersionExpressions: RegExp[]) {
		this.fullFilePaths = fullFilePaths;
		this.fullVersionExpressions = fullVersionExpressions;
		// Update this as required.  This is a general regex for various types of version expressions used by different file types.
		this.simpleVersionExpression = new RegExp(/\d+[.,]\d+[.,]\d+[\w-]*[.,]?\d*[\w-]*/, "gm");
		// Update this as required.  This is a general regex for turning unwanted version delineators into a period.
		this.unwantedVersionDelineators = new RegExp(/[,]+/, "gm");
	}

	/**
	 * Inserts the revision into the given file paths.
	 * @param revision The number to use for the revision value.
	 * @returns True if the method succeeds.
	 */
	public async insertRevision(revision: number): Promise<boolean> {
		let retVal: boolean = true;
		let versionFileData: string;
		let fileModified: boolean;
		let versionMatches: RegExpMatchArray | null;
		let replaceMatch: string;
		let doesFourthExist: boolean;
		let encodingValues: EncodingValues;
		checkRevision(revision)
		for (var filePath of this.fullFilePaths) {
			try {
				console.log(`Reading File: ${filePath}.`);
				encodingValues = await getEncodingFromTextFileBom(filePath);
				versionFileData = FileDataFactory.getFileData(filePath, encodingValues.encoding);
				fileModified = true;
				for (var index in this.fullVersionExpressions) {
					versionMatches = versionFileData.match(this.fullVersionExpressions[index]);
					if (versionMatches) {
						for (var match of versionMatches) {
							doesFourthExist = false;
							if (match.replace(this.fullVersionExpressions[index], `$8`)) {
								doesFourthExist = true;
							}
							if (doesFourthExist) {
								replaceMatch = match.replace(this.fullVersionExpressions[index], `$1$2$3$4$5$6$7${revision}$9`);
							}
							else {
								replaceMatch = match.replace(this.fullVersionExpressions[index], `$1$2$3$4$5${revision}$7$8$9`);
							}
							versionFileData = versionFileData.replace(match, replaceMatch);
							console.log(`Old String: ${match}`);
							console.log(`New String: ${replaceMatch}`);
						}
					}
					else {
						// Set to false if any one of the files fail to have the proper expression for a version.
						fileModified = retVal = false;
					}
				}
				if (fileModified) {
					// We're pulling out the BOM if it exists since it can be double-written,
					// which ends up corrupting files on some machines.
					versionFileData = versionFileData.replace(encodingValues.bom.toString(encodingValues.encoding), "");
					FileDataFactory.saveFileData(filePath, versionFileData, encodingValues.encoding);
				}
			}
			catch (err) {
				console.log(`Error on insertRevision for file \"${filePath}}\": ${err}`);
			}
		}
		return new Promise((resolve) => {
			resolve(retVal);
		});
	}

	/**
	 * Increments the revision value found in the given file.
	 * @returns True if the method succeeds.
	 */
	public async incrementRevision(): Promise<boolean> {
		const digitExpression: RegExp = new RegExp(/\d+/, "gm");
		let versionFileData: string;
		let fileModified: boolean;
		let versionMatches: RegExpMatchArray | null;
		let oldRevision: RegExpMatchArray | null;
		let newRevision: number;
		let checkRev: boolean = true;
		let doesFourthExist: boolean;
		let replaceMatch: string;
		let retVal: boolean = true;
		let encodingValues: EncodingValues;
		for (var filePath of this.fullFilePaths) {
			try {
				console.log(`Reading File: ${filePath}.`);
				encodingValues = await getEncodingFromTextFileBom(filePath);
				versionFileData = FileDataFactory.getFileData(filePath, encodingValues.encoding);
				fileModified = true;
				for (var index in this.fullVersionExpressions) {
					versionMatches = versionFileData.match(this.fullVersionExpressions[index]);
					if (versionMatches) {
						for (var match of versionMatches) {
							oldRevision = match.match(digitExpression);
							// This should never be null, but it keeps the compiler happy
							if (oldRevision) {
								newRevision = parseInt(oldRevision[oldRevision.length - 1]) + 1;
								// Check it once
								if (checkRev) {
									checkRevision(newRevision);
									checkRev = false;
								}
								doesFourthExist = false;
								if (oldRevision.length === 4) {
									doesFourthExist = true;
								}
								if (doesFourthExist) {
									replaceMatch = match.replace(this.fullVersionExpressions[index], `$1$2$3$4$5$6$7${newRevision}$9`);
								}
								else {
									replaceMatch = match.replace(this.fullVersionExpressions[index], `$1$2$3$4$5${newRevision}$7$8$9`);
								}
								versionFileData = versionFileData.replace(match, replaceMatch);
								console.log(`Old String: ${match}`);
								console.log(`New String: ${replaceMatch}`);
							}
						}
					}
					else {
						// Set to false if any one of the files fail to have the proper expression for a version.
						fileModified = retVal = false;
					}
				}
				if (fileModified) {
					// We're pulling out the BOM if it exists since it can be double-written,
					// which ends up corrupting files on some machines.
					versionFileData = versionFileData.replace(encodingValues.bom.toString(encodingValues.encoding), "");
					FileDataFactory.saveFileData(filePath, versionFileData, encodingValues.encoding);
				}
			}
			catch (err) {
				console.log(`Error on incrementRevision for file \"${filePath}\": ${err}`);
			}
		}
		return new Promise((resolve) => {
			resolve(retVal);
		});
	}

	/**
	 * Gets the full version pulled from the first instance of a version in the first file in the list.
	 * @returns The full version, or throws an error if the version could not be parsed.
	 */
	public async getFullVersion(): Promise<string> {
		return new Promise(async (resolve) => {
			let encodingValues: EncodingValues = await getEncodingFromTextFileBom(this.fullFilePaths[0]);
			let versionFileData: string = FileDataFactory.getFileData(this.fullFilePaths[0], encodingValues.encoding);
			let versionMatches: RegExpMatchArray | null = versionFileData.match(this.fullVersionExpressions[0]);
			if (versionMatches) {
				let fullVersionMatch: RegExpMatchArray | null = versionMatches[0].match(this.simpleVersionExpression);
				if (fullVersionMatch) {
					// Replace undesired version delineators with a period
					resolve(fullVersionMatch[0].replace(this.unwantedVersionDelineators, "."));
				}
			}
			else {
				throw new Error(`No Version string exists for file \"${this.fullFilePaths[0]}\"`);
			}
		});
	}
}

/**
 * A class used for incrementing or inserting the revision value into .NET Legacy AssemblyInfo.cs files.
 * This is prior to the VS2017+ .NET SDK project file standard.  Note some new Framework projects in VS2019
 * may use the legacy format depending on settings.
 */
export class CsNetLegacyVersionFile extends VersionFile {
	/**
	* Instantiates a CsNetLegacyVersionFile object so incrementing or insertion can be performed.
	* @param fullFilePaths An array containing all full file paths to the files to modify.
	 */
	constructor(fullFilePaths: string[]) {
		super(fullFilePaths,
			[new RegExp(/^([\s]*\[assembly: Assembly[\w]*Version\(")(\d+)([.])(\d+)([.])(\d+)([.]?)(\d*)("\)\].*)$/, "gm")]);
	}
}

/**
 * A class used for incrementing or inserting the revision value into .NET Core SDK (*.csproj, Directory.Build.props) files.
 * This is VS2017+ projects created using .NET SDK project format, which is valid for Framework, Standard, and Core.
 * Not valid for C++ CLR as of VS2019.
 */
export class CsNetCoreSdkVersionFile extends VersionFile {
	/**
	 * Instantiates a CsNetCoreSdkVersionFile object so incrementing or insertion can be performed.
	 * @param fullFilePaths An array containing all full file paths to the files to modify.
	 */
	constructor(fullFilePaths: string[]) {
		super(fullFilePaths,
			[
				// Used specifically to get the package version string, not the assembly or file version string
				// This will get used for getFullVersion() as well to ensure that only the package version is reported
				new RegExp(/^([\s]*<Version>)(\d+)([.])(\d+)([.])(\d+)([\w-]*[.]?)(\d*)([\w-]*<\/Version>.*)$/, "gm"),
				// Used specifically to get the assembly or file version string, not the package string
				new RegExp(/^([\s]*<(File|Assembly)Version>)(\d+)([.])(\d+)([.])(\d+)([.]?)(\d*)(<\/(File|Assembly)Version>.*)$/, "gm")
			]);
	}

	// Overridden since C# .NET Standard/Core *.csproj files have
	// a mix of 3 or 4 digit with optional alpha in the 3rd digit, and mandatory 4 digit numerical only versions.
	public async insertRevision(revision: number): Promise<boolean> {
		let retVal: boolean = true;
		let versionFileData: string;
		let foundVersion: boolean;
		let replaceMatch: string;
		let doesFourthExist: boolean;
		let versionMatches: RegExpMatchArray | null;
		let encodingValues: EncodingValues;
		checkRevision(revision)
		for (var filePath of this.fullFilePaths) {
			try {
				console.log(`Reading File: ${filePath}.`);
				encodingValues = await getEncodingFromTextFileBom(filePath);
				versionFileData = FileDataFactory.getFileData(filePath, encodingValues.encoding);
				foundVersion = true;
				doesFourthExist = false;
				// Get the package version string, we need to determine how many digits are in it before we do anything else
				let packageVersionMatch: RegExpMatchArray | null = versionFileData.match(this.fullVersionExpressions[0]);
				if (packageVersionMatch) {
					if (packageVersionMatch[0].replace(this.fullVersionExpressions[0], `$8`)) {
						doesFourthExist = true;
					}
					if (doesFourthExist) {
						replaceMatch = packageVersionMatch[0].replace(this.fullVersionExpressions[0], `$1$2$3$4$5$6$7${revision}$9`);
					}
					else {
						replaceMatch = packageVersionMatch[0].replace(this.fullVersionExpressions[0], `$1$2$3$4$5${revision}$7$8$9`);
					}
					versionFileData = versionFileData.replace(packageVersionMatch[0], replaceMatch);
					console.log(`Old Package String: ${packageVersionMatch[0]}`);
					console.log(`New Package String: ${replaceMatch}`);
				}
				else {
					foundVersion = false;
				}
				if (foundVersion) {
					// Package version found, now replace the assembly and file version matches, if they exist (not always with VS2019)
					versionMatches = versionFileData.match(this.fullVersionExpressions[1]);
					if (versionMatches) {
						for (var match of versionMatches) {
							if (doesFourthExist) {
								// NOTE: Do not use group 2 or group 11.
								replaceMatch = match.replace(this.fullVersionExpressions[1], `$1$3$4$5$6$7$8${revision}$10`);
							}
							else {
								// NOTE: Do not use group 2 or group 11.
								replaceMatch = match.replace(this.fullVersionExpressions[1], `$1$3$4$5$6${revision}$8$9$10`);
							}
							versionFileData = versionFileData.replace(match, replaceMatch);
							console.log(`Old String: ${match}`);
							console.log(`New String: ${replaceMatch}`);
						}
					}
					// Don't flag retVal as false if there are no assembly and file version matches since that is legal
					// We're pulling out the BOM if it exists since it can be double-written,
					// which ends up corrupting files on some machines.
					versionFileData = versionFileData.replace(encodingValues.bom.toString(encodingValues.encoding), "");
					FileDataFactory.saveFileData(filePath, versionFileData, encodingValues.encoding);
				}
				else {
					retVal = false
				}
			}
			catch (err) {
				console.log(`Error on insertRevision for file \"${filePath}\": ${err}`);
			}
		}
		return new Promise((resolve) => {
			resolve(retVal);
		});
	}

	// Overridden since C# .NET Standard/Core *.csproj files have
	// a mix of 3 or 4 digit with optional alpha in the 3rd digit, and mandatory 4 digit numerical only versions.
	public async incrementRevision(): Promise<boolean> {
		const digitExpression: RegExp = new RegExp(/\d+/, "gm");
		let versionFileData: string;
		let foundVersion: boolean;
		let versionMatches: RegExpMatchArray | null;
		let oldRevision: RegExpMatchArray | null;
		let newRevision: number = -1;
		let checkRev: boolean = true;
		let doesFourthExist: boolean = false;
		let replaceMatch: string;
		let retVal: boolean = true;
		let encodingValues: EncodingValues;
		for (var filePath of this.fullFilePaths) {
			try {
				console.log(`Reading File: ${filePath}.`);
				encodingValues = await getEncodingFromTextFileBom(filePath);
				versionFileData = FileDataFactory.getFileData(filePath, encodingValues.encoding);
				foundVersion = true;
				// Get the package version string, we need to determine how many digits are in it before we do anything else
				versionMatches = versionFileData.match(this.fullVersionExpressions[0]);
				if (versionMatches) {
					if (versionMatches[0].replace(this.fullVersionExpressions[0], `$8`)) {
						doesFourthExist = true;
					}
					oldRevision = versionMatches[0].match(digitExpression);
					// This should never be null, but it keeps the compiler happy
					if (oldRevision) {
						newRevision = parseInt(oldRevision[oldRevision.length - 1]) + 1;
						// Check it once
						if (checkRev) {
							checkRevision(newRevision);
							checkRev = false;
						}
						if (doesFourthExist) {
							replaceMatch = versionMatches[0].replace(this.fullVersionExpressions[0], `$1$2$3$4$5$6$7${newRevision}$9`);
						}
						else {
							replaceMatch = versionMatches[0].replace(this.fullVersionExpressions[0], `$1$2$3$4$5${newRevision}$7$8$9`);
						}
						versionFileData = versionFileData.replace(versionMatches[0], replaceMatch);
						console.log(`Old Package String: ${versionMatches[0]}`);
						console.log(`New Package String: ${replaceMatch}`);
					}
				}
				else {
					foundVersion = false;
				}
				if (foundVersion && newRevision != -1) {
					// Package version found, now increment the assembly and file version matches, if they exist (not always with VS2019)
					versionMatches = versionFileData.match(this.fullVersionExpressions[1]);
					if (versionMatches) {
						for (var match of versionMatches) {
							oldRevision = match.match(digitExpression);
							// This should never be null, but it keeps the compiler happy
							if (oldRevision) {
								if (doesFourthExist) {
									// NOTE: Do not use group 2 or group 11.
									replaceMatch = match.replace(this.fullVersionExpressions[1], `$1$3$4$5$6$7$8${newRevision}$10`);
								}
								else {
									// NOTE: Do not use group 2 or group 11.
									replaceMatch = match.replace(this.fullVersionExpressions[1], `$1$3$4$5$6${newRevision}$8$9$10`);
								}
								versionFileData = versionFileData.replace(match, replaceMatch);
								console.log(`Old String: ${match}`);
								console.log(`New String: ${replaceMatch}`);
							}
						}
					}
					// Don't flag retVal as false if there are no assembly and file version matches since that is legal
					// We're pulling out the BOM if it exists since it can be double-written,
					// which ends up corrupting files on some machines.
					versionFileData = versionFileData.replace(encodingValues.bom.toString(encodingValues.encoding), "");
					FileDataFactory.saveFileData(filePath, versionFileData, encodingValues.encoding);
				}
				else {
					retVal = false;
				}
			}
			catch (err) {
				console.log(`Error on incrementRevision for file \"${filePath}\": ${err}`);
			}
		}
		return new Promise((resolve) => {
			resolve(retVal);
		});
	}
}

/**
 * A class used for incrementing or inserting the revision value into C++ Resource (*.rc) files.
 */
export class CppVersionFile extends VersionFile {
	/**
	 * Instantiates a CppVersionFile object so incrementing or insertion can be performed.
	 * @param fullFilePaths An array containing all full file paths to the files to modify.
	 */
	constructor(fullFilePaths: string[]) {
		super(fullFilePaths,
			[
				// Cover the first part of the resource file and the secondary part of the resource file using different RegExp instances
				new RegExp(/^([\s]*[\w]*VERSION )(\d+)(,)(\d+)(,)(\d+)(,)(\d+)(.*)$/, "gm"),
				new RegExp(/^([\s]*VALUE "[\w]*Version", ")(\d+)([.])(\d+)([.])(\d+)([.])(\d+)(".*)$/, "gm")
				// Resource files use UTF16-Little Endian
			]);
	}
}

/**
 * A class used for incrementing or inserting the revision value into Kotlin build.gradle.kts or Groovy build.gradle files.
 */
export class GradleVersionFile extends VersionFile {
	/**
	 * Instantiates a GradleVersionFile object so incrementing or insertion can be performed.
	 * @param fullFilePaths An array containing all full file paths to the files to modify.
	 */
	constructor(fullFilePaths: string[]) {
		super(fullFilePaths,
			[new RegExp(/^([\s]*version = ["'])(\d+)([.])(\d+)([.])(\d+)([\w-]*[.]?)(\d*)([\w-]*["'].*)$/, "gm")]);
	}
}

/**
 * A class used for incrementing or inserting the revision value into *.json files.
 */
export class JsonVersionFile extends VersionFile {
	/**
	 * Instantiates a JsonVersionFile object so incrementing or insertion can be performed.
	 * @param fullFilePaths An array containing all full file paths to the files to modify.
	 */
	constructor(fullFilePaths: string[]) {
		super(fullFilePaths,
			[new RegExp(/^([\s]*["]version["][\s]*[:][\s]*["])(\d+)([.])(\d+)([.])(\d+)([\w-]*[.]?)(\d*)([\w-]*["][\s]*,?.*)$/, "gm")]);
	}
}