import * as path from "path";
import * as assert from "assert";
import * as stream from "stream";
import * as ttm from "azure-pipelines-task-lib/mock-test";
import * as nu from "azure-devops-node-utilities";
import * as vf from "azure-devops-node-utilities/VersionFile";

describe("VersionFile.UnitTests", function () {

	before(function () {

	});

	after(() => {

	});

	describe("#getEncodingFromTextFileBom()", function () {

		it("Should return UTF-8 when reading a UTF-8 BOM.", async function () {
			// Arrange
			this.timeout(3000);
			const expectedValues: vf.EncodingValues = <vf.EncodingValues>{
				encoding: "utf8",
				codePage: 65001,
				bom: Buffer.from([0xEF, 0xBB, 0xBF])
			};
			let fakeStream: stream.Readable = new stream.Readable();
			fakeStream._read = () => {
				fakeStream.push(Buffer.from([0xEF, 0xBB, 0xBF, 0x41, 0x42]));
				fakeStream.push(null);
			};
			vf.ReadStreamFactory.fakeReadableStream = fakeStream;

			// Act - ignore textFile string since the factory returns a fake
			//		 readable containing data.
			let actualValues: vf.EncodingValues = await vf.getEncodingFromTextFileBom("");

			// Assert
			assert.deepStrictEqual(actualValues, expectedValues);
		});

		it("Should return UTF-8 when reading a file without BOM.", async function () {
			// Arrange
			this.timeout(3000);
			const expectedValues: vf.EncodingValues = <vf.EncodingValues>{
				encoding: "utf8",
				codePage: 65001,
				bom: Buffer.from([0xEF, 0xBB, 0xBF])
			};
			let fakeStream: stream.Readable = new stream.Readable();
			fakeStream._read = () => {
				fakeStream.push(Buffer.from([0x41, 0x42, 0x43, 0x44, 0x45]));
				fakeStream.push(null);
			};
			vf.ReadStreamFactory.fakeReadableStream = fakeStream;

			// Act - ignore textFile string since the factory returns a fake
			//		 readable containing data.
			let actualValues: vf.EncodingValues = await vf.getEncodingFromTextFileBom("");

			// Assert
			assert.deepStrictEqual(actualValues, expectedValues);
		});

		it("Should return UTF-16LE when reading a UTF-16LE BOM.", async function () {
			// Arrange
			this.timeout(3000);
			const expectedValues: vf.EncodingValues = <vf.EncodingValues>{
				encoding: "utf16le",
				codePage: 1200,
				bom: Buffer.from([0xFF, 0xFE])
			};
			let fakeStream: stream.Readable = new stream.Readable();
			fakeStream._read = () => {
				fakeStream.push(Buffer.from([0xFF, 0xFE, 0x43, 0x44, 0x00]));
				fakeStream.push(null);
			};
			vf.ReadStreamFactory.fakeReadableStream = fakeStream;

			// Act - ignore textFile string since the factory returns a fake
			//		 readable containing data.
			let actualValues: vf.EncodingValues = await vf.getEncodingFromTextFileBom("");

			// Assert
			assert.deepStrictEqual(actualValues, expectedValues);
		})

	});

	describe("#checkRevision()", function () {

		it("Should throw an error when Revision is NaN.", function (done: MochaDone) {
			// Arrange
			this.timeout(3000);

			// Act
			let test = () => {
				vf.checkRevision(Number.NaN);
			};

			// Assert
			assert.throws(test);
			done();
		});

		it("Should throw an error when Revision is above ushort.Max.", function (done: MochaDone) {
			// Arrange
			this.timeout(3000);

			// Act
			let test = () => {
				vf.checkRevision(655366);
			};

			// Assert
			assert.throws(test);
			done();
		});

		it("Should throw an error when Revision is less than zero.", function (done: MochaDone) {
			// Arrange
			this.timeout(3000);

			// Act
			let test = () => {
				vf.checkRevision(-1);
			};

			// Assert
			assert.throws(test);
			done();
		});

		it("Should not throw an error when Revision is at ushort.Max.", function (done: MochaDone) {
			// Arrange
			this.timeout(3000);

			// Act
			let test = () => {
				vf.checkRevision(65535);
			};

			// Assert
			assert.doesNotThrow(test);
			done();
		});

		it("Should not throw an error when Revision is zero.", function (done: MochaDone) {
			// Arrange
			this.timeout(3000);

			// Act
			let test = () => {
				vf.checkRevision(0);
			};

			// Assert
			assert.doesNotThrow(test);
			done();
		});

	});

	function _setFakeUtf8BomForIVersionFileTests(): void {
		let fakeStream: stream.Readable = new stream.Readable();
		fakeStream._read = () => {
			fakeStream.push(Buffer.from([0xEF, 0xBB, 0xBF]));
			fakeStream.push(null);
		}
		vf.ReadStreamFactory.fakeReadableStream = fakeStream;
	}

	describe("-CsNetLegacyVersionFile", function () {

		describe("#insertRevision()", function () {

			it("Should insert Revision value 1 into 3.24.0 at two places.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetLegacyVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"using System.Reflection;\r\n" +
					"using System.Runtime.CompilerServices;\r\n\r\n" +
					"[assembly: AssemblyTitle(\"TestApplicationNETFramework\")]\r\n" +
					"[assembly: AssemblyDescription(\"3.24.0 master branch.\")]\r\n" +
					"// [assembly: AssemblyVersion(\"1.0.*\")]\r\n" +
					"[assembly: AssemblyVersion(\"3.24.0\")]\r\n" +
					"[assembly: AssemblyFileVersion(\"3.24.0\")]";
				const expectedData: string =
					"using System.Reflection;\r\n" +
					"using System.Runtime.CompilerServices;\r\n\r\n" +
					"[assembly: AssemblyTitle(\"TestApplicationNETFramework\")]\r\n" +
					"[assembly: AssemblyDescription(\"3.24.0 master branch.\")]\r\n" +
					"// [assembly: AssemblyVersion(\"1.0.*\")]\r\n" +
					"[assembly: AssemblyVersion(\"3.24.1\")]\r\n" +
					"[assembly: AssemblyFileVersion(\"3.24.1\")]";

				// Act
				await testClass.insertRevision(1);

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

			it("Should insert Revision value 34125 into 5.18.898.0 at two places.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetLegacyVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"using System.Reflection;\r\n" +
					"using System.Runtime.CompilerServices;\r\n\r\n" +
					"[assembly: AssemblyTitle(\"TestApplicationNETFramework\")]\r\n" +
					"[assembly: AssemblyDescription(\"5.18.898.X master branch.\")]\r\n" +
					"// [assembly: AssemblyVersion(\"1.0.*\")]\r\n" +
					"[assembly: AssemblyVersion(\"5.18.898.0\")]\r\n" +
					"[assembly: AssemblyFileVersion(\"5.18.898.0\")]";
				const expectedData: string =
					"using System.Reflection;\r\n" +
					"using System.Runtime.CompilerServices;\r\n\r\n" +
					"[assembly: AssemblyTitle(\"TestApplicationNETFramework\")]\r\n" +
					"[assembly: AssemblyDescription(\"5.18.898.X master branch.\")]\r\n" +
					"// [assembly: AssemblyVersion(\"1.0.*\")]\r\n" +
					"[assembly: AssemblyVersion(\"5.18.898.34125\")]\r\n" +
					"[assembly: AssemblyFileVersion(\"5.18.898.34125\")]";

				// Act
				await testClass.insertRevision(34125);

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

		});

		describe("#incrementRevision()", function () {

			it("Should increment 4.28.1959 to 4.28.1960 at two places.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetLegacyVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"using System.Reflection;\r\n" +
					"using System.Runtime.CompilerServices;\r\n\r\n" +
					"[assembly: AssemblyTitle(\"TestApplicationNETFramework\")]\r\n" +
					"[assembly: AssemblyDescription(\"4.28.0 master branch.\")]\r\n" +
					"// [assembly: AssemblyVersion(\"1.0.*\")]\r\n" +
					"[assembly: AssemblyVersion(\"4.28.1959\")]\r\n" +
					"[assembly: AssemblyFileVersion(\"4.28.1959\")]";
				const expectedData: string =
					"using System.Reflection;\r\n" +
					"using System.Runtime.CompilerServices;\r\n\r\n" +
					"[assembly: AssemblyTitle(\"TestApplicationNETFramework\")]\r\n" +
					"[assembly: AssemblyDescription(\"4.28.0 master branch.\")]\r\n" +
					"// [assembly: AssemblyVersion(\"1.0.*\")]\r\n" +
					"[assembly: AssemblyVersion(\"4.28.1960\")]\r\n" +
					"[assembly: AssemblyFileVersion(\"4.28.1960\")]";

				// Act
				await testClass.incrementRevision();

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

			it("Should increment 5.1.987.9999 to 5.1.987.10000 at two places.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetLegacyVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"using System.Reflection;\r\n" +
					"using System.Runtime.CompilerServices;\r\n\r\n" +
					"[assembly: AssemblyTitle(\"TestApplicationNETFramework\")]\r\n" +
					"[assembly: AssemblyDescription(\"5.1.987.X master branch.\")]\r\n" +
					"// [assembly: AssemblyVersion(\"1.0.*\")]\r\n" +
					"[assembly: AssemblyVersion(\"5.1.987.9999\")]\r\n" +
					"[assembly: AssemblyFileVersion(\"5.1.987.9999\")]";
				const expectedData: string =
					"using System.Reflection;\r\n" +
					"using System.Runtime.CompilerServices;\r\n\r\n" +
					"[assembly: AssemblyTitle(\"TestApplicationNETFramework\")]\r\n" +
					"[assembly: AssemblyDescription(\"5.1.987.X master branch.\")]\r\n" +
					"// [assembly: AssemblyVersion(\"1.0.*\")]\r\n" +
					"[assembly: AssemblyVersion(\"5.1.987.10000\")]\r\n" +
					"[assembly: AssemblyFileVersion(\"5.1.987.10000\")]";

				// Act
				await testClass.incrementRevision();

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

		});

		describe("#getFullVersion()", function () {

			it("Should get 4.19.13.12.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array wwith single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetLegacyVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"using System.Reflection;\r\n" +
					"using System.Runtime.CompilerServices;\r\n\r\n" +
					"[assembly: AssemblyTitle(\"TestApplicationNETFramework\")]\r\n" +
					"[assembly: AssemblyDescription(\"4.19.13.0 master branch.\")]\r\n" +
					"// [assembly: AssemblyVersion(\"1.0.*\")]\r\n" +
					"[assembly: AssemblyVersion(\"4.19.13.12\")]\r\n" +
					"[assembly: AssemblyFileVersion(\"4.19.13.12\")]";

				// Act
				const actualOutput: string = await testClass.getFullVersion();

				// Assert
				assert.strictEqual(actualOutput, "4.19.13.12");
			});

			it("Should get 7.1.18.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array wwith single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetLegacyVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"using System.Reflection;\r\n" +
					"using System.Runtime.CompilerServices;\r\n\r\n" +
					"[assembly: AssemblyTitle(\"TestApplicationNETFramework\")]\r\n" +
					"[assembly: AssemblyDescription(\"7.1.0 master branch.\")]\r\n" +
					"// [assembly: AssemblyVersion(\"1.0.*\")]\r\n" +
					"[assembly: AssemblyVersion(\"7.1.18\")]\r\n" +
					"[assembly: AssemblyFileVersion(\"7.1.18\")]";

				// Act
				const actualOutput: string = await testClass.getFullVersion();

				// Assert
				assert.strictEqual(actualOutput, "7.1.18");
			});

		});

	});

	describe("-CsNetCoreSdkVersionFile", function () {

		describe("#insertRevision()", function () {

			it("Should insert Revision value 3 into 2.1.0 at one place.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetCoreSdkVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"<Project Sdk=\"Microsoft.NET.Sdk\">\r\n\r\n" +
					"\t<PropertyGroup>\r\n" +
					"\t\t<TargetFramework>netcoreapp2.1</TargetFramework>\r\n" +
					"\t\t<RuntimeFrameworkVersion>2.1.0</RuntimeFrameworkVersion>\r\n" +
					"\t\t<Version>2.1.0</Version>\r\n" +
					"\t</PropertyGroup>\r\n\r\n" +
					"\t<ItemGroup>\r\n" +
					"\t\t<PackageReference Include=\"Madeup.NugetPackage\" Version=\"2.1.0\" />\r\n" +
					"\t</ItemGroup>\r\n\r\n" +
					"</Project>";
				const expectedData: string =
					"<Project Sdk=\"Microsoft.NET.Sdk\">\r\n\r\n" +
					"\t<PropertyGroup>\r\n" +
					"\t\t<TargetFramework>netcoreapp2.1</TargetFramework>\r\n" +
					"\t\t<RuntimeFrameworkVersion>2.1.0</RuntimeFrameworkVersion>\r\n" +
					"\t\t<Version>2.1.3</Version>\r\n" +
					"\t</PropertyGroup>\r\n\r\n" +
					"\t<ItemGroup>\r\n" +
					"\t\t<PackageReference Include=\"Madeup.NugetPackage\" Version=\"2.1.0\" />\r\n" +
					"\t</ItemGroup>\r\n\r\n" +
					"</Project>";

				// Act
				await testClass.insertRevision(3);

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

			it("Should insert Revision value 2458 into 7.1.738-alpha.0 at three places.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetCoreSdkVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"<Project Sdk=\"Microsoft.NET.Sdk\">\r\n\r\n" +
					"\t<PropertyGroup>\r\n" +
					"\t\t<TargetFramework>netstandard2.0</TargetFramework>\r\n" +
					"\t\t<Version>7.1.738-alpha.0</Version>\r\n" +
					"\t\t<AssemblyVersion>7.1.738.0</AssemblyVersion>\r\n" +
					"\t\t<FileVersion>7.1.738.0</FileVersion>\r\n" +
					"\t</PropertyGroup>\r\n\r\n" +
					"\t<ItemGroup>\r\n" +
					"\t\t<PackageReference Include=\"Madeup.NugetPackage\" Version=\"7.1.738-alpha.0\" />\r\n" +
					"\t</ItemGroup>\r\n\r\n" +
					"</Project>";
				const expectedData: string =
					"<Project Sdk=\"Microsoft.NET.Sdk\">\r\n\r\n" +
					"\t<PropertyGroup>\r\n" +
					"\t\t<TargetFramework>netstandard2.0</TargetFramework>\r\n" +
					"\t\t<Version>7.1.738-alpha.2458</Version>\r\n" +
					"\t\t<AssemblyVersion>7.1.738.2458</AssemblyVersion>\r\n" +
					"\t\t<FileVersion>7.1.738.2458</FileVersion>\r\n" +
					"\t</PropertyGroup>\r\n\r\n" +
					"\t<ItemGroup>\r\n" +
					"\t\t<PackageReference Include=\"Madeup.NugetPackage\" Version=\"7.1.738-alpha.0\" />\r\n" +
					"\t</ItemGroup>\r\n\r\n" +
					"</Project>";

				// Act
				await testClass.insertRevision(2458);

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

		});

		describe("#incrementRevision()", function () {

			it("Should increment 2.5.2798-alpha to 2.5.2799-alpha at three places.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetCoreSdkVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"<Project Sdk=\"Microsoft.NET.Sdk\">\r\n\r\n" +
					"\t<PropertyGroup>\r\n" +
					"\t\t<TargetFramework>netstandard2.0</TargetFramework>\r\n" +
					"\t\t<Version>2.5.2798-alpha</Version>\r\n" +
					"\t\t<AssemblyVersion>2.5.2798</AssemblyVersion>\r\n" +
					"\t\t<FileVersion>2.5.2798</FileVersion>\r\n" +
					"\t</PropertyGroup>\r\n\r\n" +
					"\t<ItemGroup>\r\n" +
					"\t\t<PackageReference Include=\"Madeup.NugetPackage\" Version=\"2.5.2798-alpha\" />\r\n" +
					"\t</ItemGroup>\r\n\r\n" +
					"</Project>";
				const expectedData: string =
					"<Project Sdk=\"Microsoft.NET.Sdk\">\r\n\r\n" +
					"\t<PropertyGroup>\r\n" +
					"\t\t<TargetFramework>netstandard2.0</TargetFramework>\r\n" +
					"\t\t<Version>2.5.2799-alpha</Version>\r\n" +
					"\t\t<AssemblyVersion>2.5.2799</AssemblyVersion>\r\n" +
					"\t\t<FileVersion>2.5.2799</FileVersion>\r\n" +
					"\t</PropertyGroup>\r\n\r\n" +
					"\t<ItemGroup>\r\n" +
					"\t\t<PackageReference Include=\"Madeup.NugetPackage\" Version=\"2.5.2798-alpha\" />\r\n" +
					"\t</ItemGroup>\r\n\r\n" +
					"</Project>";

				// Act
				await testClass.incrementRevision();

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

			it("Should increment 2.1.0.0 to 2.1.0.1 at one place.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetCoreSdkVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"<Project Sdk=\"Microsoft.NET.Sdk\">\r\n\r\n" +
					"\t<PropertyGroup>\r\n" +
					"\t\t<TargetFramework>netcoreapp2.1</TargetFramework>\r\n" +
					"\t\t<RuntimeFrameworkVersion>2.1.0.0</RuntimeFrameworkVersion>\r\n" +
					"\t\t<Version>2.1.0.0</Version>\r\n" +
					"\t</PropertyGroup>\r\n\r\n" +
					"\t<ItemGroup>\r\n" +
					"\t\t<PackageReference Include=\"Madeup.NugetPackage\" Version=\"2.1.0.0\" />\r\n" +
					"\t</ItemGroup>\r\n\r\n" +
					"</Project>";
				const expectedData: string =
					"<Project Sdk=\"Microsoft.NET.Sdk\">\r\n\r\n" +
					"\t<PropertyGroup>\r\n" +
					"\t\t<TargetFramework>netcoreapp2.1</TargetFramework>\r\n" +
					"\t\t<RuntimeFrameworkVersion>2.1.0.0</RuntimeFrameworkVersion>\r\n" +
					"\t\t<Version>2.1.0.1</Version>\r\n" +
					"\t</PropertyGroup>\r\n\r\n" +
					"\t<ItemGroup>\r\n" +
					"\t\t<PackageReference Include=\"Madeup.NugetPackage\" Version=\"2.1.0.0\" />\r\n" +
					"\t</ItemGroup>\r\n\r\n" +
					"</Project>";

				// Act
				await testClass.incrementRevision();

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

		});

		describe("#getFullVersion()", function () {

			it("Should get 2.1.0.3.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array wwith single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetCoreSdkVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"<Project Sdk=\"Microsoft.NET.Sdk\">\r\n\r\n" +
					"\t<PropertyGroup>\r\n" +
					"\t\t<TargetFramework>netcoreapp2.1</TargetFramework>\r\n" +
					"\t\t<RuntimeFrameworkVersion>2.1.0.0</RuntimeFrameworkVersion>\r\n" +
					"\t\t<Version>2.1.0.3</Version>\r\n" +
					"\t</PropertyGroup>\r\n\r\n" +
					"\t<ItemGroup>\r\n" +
					"\t\t<PackageReference Include=\"Madeup.NugetPackage\" Version=\"7.9.1\" />\r\n" +
					"\t</ItemGroup>\r\n\r\n" +
					"</Project>";

				// Act
				const actualOutput: string = await testClass.getFullVersion();

				// Assert
				assert.strictEqual(actualOutput, "2.1.0.3");
			});

			it("Should get 4.25.22-alpha.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array wwith single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CsNetCoreSdkVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"<Project Sdk=\"Microsoft.NET.Sdk\">\r\n\r\n" +
					"\t<PropertyGroup>\r\n" +
					"\t\t<TargetFramework>netstandard2.0</TargetFramework>\r\n" +
					"\t\t<Version>4.25.22-alpha</Version>\r\n" +
					"\t\t<AssemblyVersion>4.25.22.0</AssemblyVersion>\r\n" +
					"\t\t<FileVersion>4.25.22.0</FileVersion>\r\n" +
					"\t</PropertyGroup>\r\n\r\n" +
					"\t<ItemGroup>\r\n" +
					"\t\t<PackageReference Include=\"Madeup.NugetPackage\" Version=\"5.0.0\" />\r\n" +
					"\t</ItemGroup>\r\n\r\n" +
					"</Project>";

				// Act
				const actualOutput: string = await testClass.getFullVersion();

				// Assert
				assert.strictEqual(actualOutput, "4.25.22-alpha");
			});

		});

	});

	describe("-CppVersionFile", function () {

		describe("#insertRevision()", function () {

			it("Should insert Revision value 597 into 7.5.95.0 at four places.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CppVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"#include \"resource.h\"\r\n\r\n" +
					"#define APSTUDIO_READONLY_SYMBOLS\r\n" +
					"#include \"winres.h\"\r\n\r\n" +
					"#undef APSTUDIO_READONLY_SYMBOLS\r\n\r\n" +
					"#if !defined(AFX_RESOURCE_DLL) || defined(AFX_TARG_ENU)\r\n" +
					"LANGUAGE LANG_ENGLISH, SUBLANG_ENGLISH_US\r\n" +
					"#ifdef APSTUDIO_INVOKED\r\n" +
					"1 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"resource.h\\0\"" +
					"END\r\n\r\n" +
					"2 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"#include \"\"winres.h\"\"\\r\\n\"\r\n" +
					"\t\"\\0\"\r\n" +
					"END\r\n\r\n" +
					"3 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"\\r\\n\"\r\n" +
					"\t\"\\0\"\r\n" +
					"END\r\n\r\n" +
					"#endif\r\n\r\n" +
					"VS VERSION INFO VERSIONINFO\r\n" +
					" FILEVERSION 7,5,95,0\r\n" +
					" PRODUCTVERSION 7,5,95,0\r\n" +
					" FILECLASSMASK 0x3fL\r\n" +
					"BEGIN\r\n" +
					"\tBLOCK \"StringFileInfo\"\r\n" +
					"\tBEGIN\r\n" +
					"\t\tBLOCK \"040904b0\"\r\n" +
					"\t\tBEGIN\r\n" +
					"\t\t\tVALUE \"FileVersion\", \"7.5.95.0\"\r\n" +
					"\t\t\tVALUE \"InternalName\", \"TestA.exe\"\r\n" +
					"\t\t\tVALUE \"ProductVersion\", \"7.5.95.0\"\r\n" +
					"\t\tEND\r\n" +
					"\tEND\r\n" +
					"END\r\n" +
					"#endif\r\n\r\n" +
					"#ifndef APSTUDIO_INVOKED\r\n" +
					"#endif\r\n\r\n";
				const expectedData: string =
					"#include \"resource.h\"\r\n\r\n" +
					"#define APSTUDIO_READONLY_SYMBOLS\r\n" +
					"#include \"winres.h\"\r\n\r\n" +
					"#undef APSTUDIO_READONLY_SYMBOLS\r\n\r\n" +
					"#if !defined(AFX_RESOURCE_DLL) || defined(AFX_TARG_ENU)\r\n" +
					"LANGUAGE LANG_ENGLISH, SUBLANG_ENGLISH_US\r\n" +
					"#ifdef APSTUDIO_INVOKED\r\n" +
					"1 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"resource.h\\0\"" +
					"END\r\n\r\n" +
					"2 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"#include \"\"winres.h\"\"\\r\\n\"\r\n" +
					"\t\"\\0\"\r\n" +
					"END\r\n\r\n" +
					"3 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"\\r\\n\"\r\n" +
					"\t\"\\0\"\r\n" +
					"END\r\n\r\n" +
					"#endif\r\n\r\n" +
					"VS VERSION INFO VERSIONINFO\r\n" +
					" FILEVERSION 7,5,95,597\r\n" +
					" PRODUCTVERSION 7,5,95,597\r\n" +
					" FILECLASSMASK 0x3fL\r\n" +
					"BEGIN\r\n" +
					"\tBLOCK \"StringFileInfo\"\r\n" +
					"\tBEGIN\r\n" +
					"\t\tBLOCK \"040904b0\"\r\n" +
					"\t\tBEGIN\r\n" +
					"\t\t\tVALUE \"FileVersion\", \"7.5.95.597\"\r\n" +
					"\t\t\tVALUE \"InternalName\", \"TestA.exe\"\r\n" +
					"\t\t\tVALUE \"ProductVersion\", \"7.5.95.597\"\r\n" +
					"\t\tEND\r\n" +
					"\tEND\r\n" +
					"END\r\n" +
					"#endif\r\n\r\n" +
					"#ifndef APSTUDIO_INVOKED\r\n" +
					"#endif\r\n\r\n";

				// Act
				await testClass.insertRevision(597);

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

		});

		describe("#incrementRevision()", function () {

			it("Should increment 4.7.8.199 to 4.7.8.200 at four places.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CppVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"#include \"resource.h\"\r\n\r\n" +
					"#define APSTUDIO_READONLY_SYMBOLS\r\n" +
					"#include \"winres.h\"\r\n\r\n" +
					"#undef APSTUDIO_READONLY_SYMBOLS\r\n\r\n" +
					"#if !defined(AFX_RESOURCE_DLL) || defined(AFX_TARG_ENU)\r\n" +
					"LANGUAGE LANG_ENGLISH, SUBLANG_ENGLISH_US\r\n" +
					"#ifdef APSTUDIO_INVOKED\r\n" +
					"1 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"resource.h\\0\"" +
					"END\r\n\r\n" +
					"2 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"#include \"\"winres.h\"\"\\r\\n\"\r\n" +
					"\t\"\\0\"\r\n" +
					"END\r\n\r\n" +
					"3 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"\\r\\n\"\r\n" +
					"\t\"\\0\"\r\n" +
					"END\r\n\r\n" +
					"#endif\r\n\r\n" +
					"VS VERSION INFO VERSIONINFO\r\n" +
					" FILEVERSION 4,7,8,199\r\n" +
					" PRODUCTVERSION 4,7,8,199\r\n" +
					" FILECLASSMASK 0x3fL\r\n" +
					"BEGIN\r\n" +
					"\tBLOCK \"StringFileInfo\"\r\n" +
					"\tBEGIN\r\n" +
					"\t\tBLOCK \"040904b0\"\r\n" +
					"\t\tBEGIN\r\n" +
					"\t\t\tVALUE \"FileVersion\", \"4.7.8.199\"\r\n" +
					"\t\t\tVALUE \"InternalName\", \"TestA.exe\"\r\n" +
					"\t\t\tVALUE \"ProductVersion\", \"4.7.8.199\"\r\n" +
					"\t\tEND\r\n" +
					"\tEND\r\n" +
					"END\r\n" +
					"#endif\r\n\r\n" +
					"#ifndef APSTUDIO_INVOKED\r\n" +
					"#endif\r\n\r\n";
				const expectedData: string =
					"#include \"resource.h\"\r\n\r\n" +
					"#define APSTUDIO_READONLY_SYMBOLS\r\n" +
					"#include \"winres.h\"\r\n\r\n" +
					"#undef APSTUDIO_READONLY_SYMBOLS\r\n\r\n" +
					"#if !defined(AFX_RESOURCE_DLL) || defined(AFX_TARG_ENU)\r\n" +
					"LANGUAGE LANG_ENGLISH, SUBLANG_ENGLISH_US\r\n" +
					"#ifdef APSTUDIO_INVOKED\r\n" +
					"1 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"resource.h\\0\"" +
					"END\r\n\r\n" +
					"2 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"#include \"\"winres.h\"\"\\r\\n\"\r\n" +
					"\t\"\\0\"\r\n" +
					"END\r\n\r\n" +
					"3 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"\\r\\n\"\r\n" +
					"\t\"\\0\"\r\n" +
					"END\r\n\r\n" +
					"#endif\r\n\r\n" +
					"VS VERSION INFO VERSIONINFO\r\n" +
					" FILEVERSION 4,7,8,200\r\n" +
					" PRODUCTVERSION 4,7,8,200\r\n" +
					" FILECLASSMASK 0x3fL\r\n" +
					"BEGIN\r\n" +
					"\tBLOCK \"StringFileInfo\"\r\n" +
					"\tBEGIN\r\n" +
					"\t\tBLOCK \"040904b0\"\r\n" +
					"\t\tBEGIN\r\n" +
					"\t\t\tVALUE \"FileVersion\", \"4.7.8.200\"\r\n" +
					"\t\t\tVALUE \"InternalName\", \"TestA.exe\"\r\n" +
					"\t\t\tVALUE \"ProductVersion\", \"4.7.8.200\"\r\n" +
					"\t\tEND\r\n" +
					"\tEND\r\n" +
					"END\r\n" +
					"#endif\r\n\r\n" +
					"#ifndef APSTUDIO_INVOKED\r\n" +
					"#endif\r\n\r\n";

				// Act
				await testClass.incrementRevision();

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

		});

		describe("#getFullVersion()", function () {

			it("Should get 9.8.7.65.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array wwith single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.CppVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"#include \"resource.h\"\r\n\r\n" +
					"#define APSTUDIO_READONLY_SYMBOLS\r\n" +
					"#include \"winres.h\"\r\n\r\n" +
					"#undef APSTUDIO_READONLY_SYMBOLS\r\n\r\n" +
					"#if !defined(AFX_RESOURCE_DLL) || defined(AFX_TARG_ENU)\r\n" +
					"LANGUAGE LANG_ENGLISH, SUBLANG_ENGLISH_US\r\n" +
					"#ifdef APSTUDIO_INVOKED\r\n" +
					"1 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"resource.h\\0\"" +
					"END\r\n\r\n" +
					"2 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"#include \"\"winres.h\"\"\\r\\n\"\r\n" +
					"\t\"\\0\"\r\n" +
					"END\r\n\r\n" +
					"3 TEXTINCLUDE\r\n" +
					"BEGIN\r\n" +
					"\t\"\\r\\n\"\r\n" +
					"\t\"\\0\"\r\n" +
					"END\r\n\r\n" +
					"#endif\r\n\r\n" +
					"VS VERSION INFO VERSIONINFO\r\n" +
					" FILEVERSION 9,8,7,65\r\n" +
					" PRODUCTVERSION 9,8,7,65\r\n" +
					" FILECLASSMASK 0x3fL\r\n" +
					"BEGIN\r\n" +
					"\tBLOCK \"StringFileInfo\"\r\n" +
					"\tBEGIN\r\n" +
					"\t\tBLOCK \"040904b0\"\r\n" +
					"\t\tBEGIN\r\n" +
					"\t\t\tVALUE \"FileVersion\", \"9.8.7.65\"\r\n" +
					"\t\t\tVALUE \"InternalName\", \"TestA.exe\"\r\n" +
					"\t\t\tVALUE \"ProductVersion\", \"9.8.7.65\"\r\n" +
					"\t\tEND\r\n" +
					"\tEND\r\n" +
					"END\r\n" +
					"#endif\r\n\r\n" +
					"#ifndef APSTUDIO_INVOKED\r\n" +
					"#endif\r\n\r\n";

				// Act
				const actualOutput: string = await testClass.getFullVersion();

				// Assert
				assert.strictEqual(actualOutput, "9.8.7.65");
			});

		});

	});

	describe("-GradleVersionFile", function () {

		describe("#insertRevision()", function () {

			it("Should insert Revision value 1147 into 5.8.0-alpha at one place.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.GradleVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"plugins {\r\n" +
					"\tjava\r\n" +
					"}\r\n\r\n" +
					"java {\r\n" +
					"\tsourceCompatibility = JavaVersion.VERSION_1_8\r\n" +
					"\ttargetCompatibility = JavaVersion.VERSION_1_8\r\n" +
					"}\r\n\r\n" +
					"version = \"5.8.0-alpha\"\r\n\r\n" +
					"dependencies {\r\n" +
					"\timplementation(\"org.test:test-madeup:5.8.0-alpha\")\r\n" +
					"}\r\n";
				const expectedData: string =
					"plugins {\r\n" +
					"\tjava\r\n" +
					"}\r\n\r\n" +
					"java {\r\n" +
					"\tsourceCompatibility = JavaVersion.VERSION_1_8\r\n" +
					"\ttargetCompatibility = JavaVersion.VERSION_1_8\r\n" +
					"}\r\n\r\n" +
					"version = \"5.8.1147-alpha\"\r\n\r\n" +
					"dependencies {\r\n" +
					"\timplementation(\"org.test:test-madeup:5.8.0-alpha\")\r\n" +
					"}\r\n";

				// Act
				await testClass.insertRevision(1147);

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

			it("Should insert Revision value 558 into 2.1.8.0 at one place.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.GradleVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"plugins {\r\n" +
					"\t'java'\r\n" +
					"}\r\n\r\n" +
					"sourceCompatibility = '1.8'\r\n" +
					"targetCompatibility = '1.8'\r\n" +
					"version = '2.1.8.0'\r\n\r\n" +
					"dependencies {\r\n" +
					"\timplementation 'org.test:test-madeup:2.1.8.0'\r\n" +
					"}\r\n";
				const expectedData: string =
					"plugins {\r\n" +
					"\t'java'\r\n" +
					"}\r\n\r\n" +
					"sourceCompatibility = '1.8'\r\n" +
					"targetCompatibility = '1.8'\r\n" +
					"version = '2.1.8.558'\r\n\r\n" +
					"dependencies {\r\n" +
					"\timplementation 'org.test:test-madeup:2.1.8.0'\r\n" +
					"}\r\n";

				// Act
				await testClass.insertRevision(558);

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

		});

		describe("#incrementRevision()", function () {

			it("Should increment 3.0.98 to 3.0.99 at one place.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.GradleVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"plugins {\r\n" +
					"\t'java'\r\n" +
					"}\r\n\r\n" +
					"sourceCompatibility = '1.8'\r\n" +
					"targetCompatibility = '1.8'\r\n" +
					"version = '3.0.98'\r\n\r\n" +
					"dependencies {\r\n" +
					"\timplementation 'org.test:test-madeup:3.0.98'\r\n" +
					"}\r\n";
				const expectedData: string =
					"plugins {\r\n" +
					"\t'java'\r\n" +
					"}\r\n\r\n" +
					"sourceCompatibility = '1.8'\r\n" +
					"targetCompatibility = '1.8'\r\n" +
					"version = '3.0.99'\r\n\r\n" +
					"dependencies {\r\n" +
					"\timplementation 'org.test:test-madeup:3.0.98'\r\n" +
					"}\r\n";

				// Act
				await testClass.incrementRevision();

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

			it("Should increment 3.1.4.5-alpha to 3.1.4.6-alpha at one place.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.GradleVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"plugins {\r\n" +
					"\tjava\r\n" +
					"}\r\n\r\n" +
					"java {\r\n" +
					"\tsourceCompatibility = JavaVersion.VERSION_1_8\r\n" +
					"\ttargetCompatibility = JavaVersion.VERSION_1_8\r\n" +
					"}\r\n\r\n" +
					"version = \"3.1.4.5-alpha\"\r\n\r\n" +
					"dependencies {\r\n" +
					"\timplementation(\"org.test:test-madeup:3.1.4.5-alpha\")\r\n" +
					"}\r\n";
				const expectedData: string =
					"plugins {\r\n" +
					"\tjava\r\n" +
					"}\r\n\r\n" +
					"java {\r\n" +
					"\tsourceCompatibility = JavaVersion.VERSION_1_8\r\n" +
					"\ttargetCompatibility = JavaVersion.VERSION_1_8\r\n" +
					"}\r\n\r\n" +
					"version = \"3.1.4.6-alpha\"\r\n\r\n" +
					"dependencies {\r\n" +
					"\timplementation(\"org.test:test-madeup:3.1.4.5-alpha\")\r\n" +
					"}\r\n";

				// Act
				await testClass.incrementRevision();

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

		});

		describe("#getFullVersion()", function () {

			it("Should get 5.0.4-alpha.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array wwith single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.GradleVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"plugins {\r\n" +
					"\t'java'\r\n" +
					"}\r\n\r\n" +
					"sourceCompatibility = '1.8'\r\n" +
					"targetCompatibility = '1.8'\r\n" +
					"version = '5.0.4-alpha'\r\n\r\n" +
					"dependencies {\r\n" +
					"\timplementation 'org.test:test-madeup:1.0.0'\r\n" +
					"}\r\n";

				// Act
				const actualOutput: string = await testClass.getFullVersion();

				// Assert
				assert.strictEqual(actualOutput, "5.0.4-alpha");
			});

			it("Should get 9.8.1.9881.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array wwith single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.GradleVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"plugins {\r\n" +
					"\tjava\r\n" +
					"}\r\n\r\n" +
					"java {\r\n" +
					"\tsourceCompatibility = JavaVersion.VERSION_1_8\r\n" +
					"\ttargetCompatibility = JavaVersion.VERSION_1_8\r\n" +
					"}\r\n\r\n" +
					"version = \"9.8.1.9881\"\r\n\r\n" +
					"dependencies {\r\n" +
					"\timplementation(\"org.test:test-madeup:1.0.4\")\r\n" +
					"}\r\n";

				// Act
				const actualOutput: string = await testClass.getFullVersion();

				// Assert
				assert.strictEqual(actualOutput, "9.8.1.9881");
			});

		});

	});

	describe("-JsonVersionFile", function () {

		describe("#insertRevision()", function () {

			it("Should insert Revision value 147 into 5.2.0 at one place.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.JsonVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"{\r\n" +
					"\t\"name\": \"testFile\",\r\n" +
					"\t\"description\": \"Test File.\",\r\n" +
					"\t\"version\": \"5.2.0\",\r\n" +
					"\t\"repository\": {},\r\n" +
					"\t\"dependencies\": {\r\n" +
					"\t\t\"some-madeup-lib\": \"5.2.0\"\r\n" +
					"\t}\r\n" +
					"}\r\n";
				const expectedData: string =
					"{\r\n" +
					"\t\"name\": \"testFile\",\r\n" +
					"\t\"description\": \"Test File.\",\r\n" +
					"\t\"version\": \"5.2.147\",\r\n" +
					"\t\"repository\": {},\r\n" +
					"\t\"dependencies\": {\r\n" +
					"\t\t\"some-madeup-lib\": \"5.2.0\"\r\n" +
					"\t}\r\n" +
					"}\r\n";

				// Act
				await testClass.insertRevision(147);

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

			it("Should insert Revision value 82 into 3.7.148.0-alpha at one place.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.JsonVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"{\r\n" +
					"\t\"name\": \"testFile\",\r\n" +
					"\t\"description\": \"Test File.\",\r\n" +
					"\t\"version\": \"3.7.148.0-alpha\",\r\n" +
					"\t\"repository\": {},\r\n" +
					"\t\"dependencies\": {\r\n" +
					"\t\t\"some-madeup-lib\": \"3.7.148.0-alpha\"\r\n" +
					"\t}\r\n" +
					"}\r\n";
				const expectedData: string =
					"{\r\n" +
					"\t\"name\": \"testFile\",\r\n" +
					"\t\"description\": \"Test File.\",\r\n" +
					"\t\"version\": \"3.7.148.82-alpha\",\r\n" +
					"\t\"repository\": {},\r\n" +
					"\t\"dependencies\": {\r\n" +
					"\t\t\"some-madeup-lib\": \"3.7.148.0-alpha\"\r\n" +
					"\t}\r\n" +
					"}\r\n";

				// Act
				await testClass.insertRevision(82);

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

		});

		describe("#incrementRevision()", function () {

			it("Should increment 3.2.2487-alpha to 3.2.2488-alpha at one place.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.JsonVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"{\r\n" +
					"\t\"name\": \"testFile\",\r\n" +
					"\t\"description\": \"Test File.\",\r\n" +
					"\t\"version\": \"3.2.2487-alpha\",\r\n" +
					"\t\"repository\": {},\r\n" +
					"\t\"dependencies\": {\r\n" +
					"\t\t\"some-madeup-lib\": \"3.2.2487-alpha\"\r\n" +
					"\t}\r\n" +
					"}\r\n";
				const expectedData: string =
					"{\r\n" +
					"\t\"name\": \"testFile\",\r\n" +
					"\t\"description\": \"Test File.\",\r\n" +
					"\t\"version\": \"3.2.2488-alpha\",\r\n" +
					"\t\"repository\": {},\r\n" +
					"\t\"dependencies\": {\r\n" +
					"\t\t\"some-madeup-lib\": \"3.2.2487-alpha\"\r\n" +
					"\t}\r\n" +
					"}\r\n";

				// Act
				await testClass.incrementRevision();

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

			it("Should increment 18.2.4.180 to 18.2.4.181 at one place.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array with single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.JsonVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"{\r\n" +
					"\t\"name\": \"testFile\",\r\n" +
					"\t\"description\": \"Test File.\",\r\n" +
					"\t\"version\": \"18.2.4.180\",\r\n" +
					"\t\"repository\": {},\r\n" +
					"\t\"dependencies\": {\r\n" +
					"\t\t\"some-madeup-lib\": \"18.2.4.180\"\r\n" +
					"\t}\r\n" +
					"}\r\n";
				const expectedData: string =
					"{\r\n" +
					"\t\"name\": \"testFile\",\r\n" +
					"\t\"description\": \"Test File.\",\r\n" +
					"\t\"version\": \"18.2.4.181\",\r\n" +
					"\t\"repository\": {},\r\n" +
					"\t\"dependencies\": {\r\n" +
					"\t\t\"some-madeup-lib\": \"18.2.4.180\"\r\n" +
					"\t}\r\n" +
					"}\r\n";

				// Act
				await testClass.incrementRevision();

				// Assert
				assert.strictEqual(vf.FileDataFactory.generatedOutput, expectedData);
			});

		});

		describe("#getFullVersion()", function () {

			it("Should get 0.8.1.3-alpha.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array wwith single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.JsonVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"{\r\n" +
					"\t\"name\": \"testFile\",\r\n" +
					"\t\"description\": \"Test File.\",\r\n" +
					"\t\"version\": \"0.8.1.3-alpha\",\r\n" +
					"\t\"repository\": {},\r\n" +
					"\t\"dependencies\": {\r\n" +
					"\t\t\"some-madeup-lib\": \"1.5.0\"\r\n" +
					"\t}\r\n" +
					"}\r\n";

				// Act
				const actualOutput: string = await testClass.getFullVersion();

				// Assert
				assert.strictEqual(actualOutput, "0.8.1.3-alpha");
			});

			it("Should get 9.8.445.", async function () {
				// Arrange
				this.timeout(3000);
				_setFakeUtf8BomForIVersionFileTests();
				// Pass in array wwith single empty string.
				// This allows the act method to run through once.
				let testClass: vf.IVersionFile = new vf.JsonVersionFile([""]);
				vf.FileDataFactory.fakeInput =
					"{\r\n" +
					"\t\"name\": \"testFile\",\r\n" +
					"\t\"description\": \"Test File.\",\r\n" +
					"\t\"version\": \"9.8.445\",\r\n" +
					"\t\"repository\": {},\r\n" +
					"\t\"dependencies\": {\r\n" +
					"\t\t\"some-madeup-lib\": \"1.1.5\"\r\n" +
					"\t}\r\n" +
					"}\r\n";

				// Act
				const actualOutput: string = await testClass.getFullVersion();

				// Assert
				assert.strictEqual(actualOutput, "9.8.445");
			});

		});

	});

});