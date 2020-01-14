# Version Cross-Reference #

* Use ^3.0.0 for TFS 2018.
* Use ^4.0.0 for ADOS 2019.

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