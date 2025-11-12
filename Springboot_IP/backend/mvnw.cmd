@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM
@REM MAVEN_CMD_LINE_ARGS is expanded during build time
@REM so this needs to be defined outside quotes to prevent double expansion
@REM

@setlocal

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
setlocal enabledelayedexpansion

for /f "usebackq delims=" %%F in ("%DIRNAME%mvn") do set "WRAPPER_SCRIPT=%%F"

call "%JAVA_EXE%" %MAVEN_OPTS% -classpath "%DIRNAME%.mvn/wrapper/maven-wrapper.jar" "-Dmaven.multiModuleProjectDirectory=%CD%" org.apache.maven.wrapper.MavenWrapperMain %*

:end
@endlocal & set ERROR_CODE=%ERRORLEVEL%

if not "%MAVEN_BATCH_PAUSE%"=="" pause

if "%ERROR_CODE%"=="0" goto mainEnd

:fail
rem Set variable MAVEN_BATCH_EXIT_CONSOLE if you need the _script_ return code instead of error level.
rem set MAVEN_BATCH_EXIT_CONSOLE=true

exit /b %ERROR_CODE%

:mainEnd
if "%OS%"=="Windows_NT" endlocal

exit /b %ERROR_CODE%
