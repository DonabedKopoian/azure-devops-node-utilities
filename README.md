# Version Cross-Reference #

* Use ^3.0.0 for TFS 2018.
* Use ^4.0.0 for ADOS 2019.

## Vulnerability Notes ##
This package contains vulnerabilities from sub-packages that are
referenced in the following Microsoft Azure packages:
* azure-devops-node-api.
  * underscore
    * 2 High Vulnerabilities
* azure-pipelines-task-lib.
  * shelljs
    * 1 High Vulnerability
    * 1 Moderate Vulnerability

The TFS 2018 versions will not be updated at this time and Microsoft is no longer
creating security patches for the Azure package versions that are necessary to function
for TFS 2018.  Newer versions of the library will fail to function on TFS 2018.

THe ADOS 2019/2020 versions will require breaking changes in order to resolve the vulnerabilities,
and I currently have no means to test these components to validate that they remain functional
after updating.

Please run npm audit for the version you intend to use to determine if the vulnerabilities
are deal breakers.

# Components #

## CheckIn ##

Contains easy-to-setup interfaces that allow to add, edit,
or remove files from either a Team Foundation version control repository,
or a git version control repository via modifications in the build agent's working directory.

## Common ##

Contains methods which are used commonly for azure-devops-node-api or azure-pipelines-task-lib calls.

## VersionFile ##

Contains common components which are used to increment the existing revision value, or insert a revision value,
into version files for various types of projects, including:
* .NET Legacy (AssemblyInfo.cs)
* .NET Core SDK (*.csproj, Directory.Build.props)
* C++ Resource Files (*.rc)
* Gradle with Groovy (build.gradle) (required to declare version at primary level).
* Gradle with Kotlin (build.gradle.kts) (required to declare version at primary level).
* JSON Files (*.json)

# To Build or Publish to a Local Repository #

1. Download root source code
2. At either the TFS2018 or ADOS2019 directory, run npm install
3. Go inside lib folder which gets created
4. Run npm publish from this folder to publish to a local repository.

# Unit Tests #

Unit Tests will only work under the following conditions, and only
after "npm install" has been called on the root directory.
* "npm test" is called from the "lib" folder.
* "npm test" is called from the "tests" folder.

# Integration Tests #

Integration Tests shall observe the following:
1. Integration Tests shall not modify tfvc nor git repositories.
2. Integration Tests shall not modify Build nor Release pipelines.
3. Integration Tests shall modify their own unique files on the file system.
4. Integration Tests shall keep an original file they modify in the "files" directory.
5. Integration Tests shall only modify from the "_files" directory to preserve tests over time.