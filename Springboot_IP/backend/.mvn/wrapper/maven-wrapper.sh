#!/bin/sh
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#    https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

##############################################################################
# Maven Start Up Batch script for Unix
##############################################################################

# Begin all RUN commands after the START label
run() {
  [ -z "$MAVEN_CMD_LINE_ARGS" ] \
    && MAVEN_CMD_LINE_ARGS=$(echo "$MAVEN_ARGS" | sed -e 's/^[[:space:]]*//')
  [ -z "$MAVEN_CMD_LINE_ARGS" ] \
    && MAVEN_CMD_LINE_ARGS="$@"

  # if JAVA_HOME is not set we locate the java executable
  if [ ! -x "$JAVA_HOME/bin/java" ] ; then
    java_msg="Java executable not found in specified JAVA_HOME location [ $JAVA_HOME/bin/java ].  Please set the JAVA_HOME variable in your environment, echo %JAVA_HOME%"
    echo "$java_msg"
    exit 1
  fi

  if [ -z "$JAVA_HOME" ] ; then
    java_msg="JAVA_HOME not found in your environment. Please set the JAVA_HOME variable in your environment, echo %JAVA_HOME%"
    echo "$java_msg"
    exit 1
  fi

  WRAPPER_JAR="$PWD/.mvn/wrapper/maven-wrapper.jar"
  WRAPPER_LAUNCHER="org.apache.maven.wrapper.MavenWrapperMain"

  # If the wrapper jar is not present, download it
  if [ ! -f "$WRAPPER_JAR" ]; then
    if command -v wget > /dev/null; then
      if [ "$MVNW_VERBOSE" = true ]; then
        echo "Downloading from: $MVNW_REPO_URL/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"
      fi
      mkdir -p "$(dirname "$WRAPPER_JAR")"
      wget --quiet "$MVNW_REPO_URL/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar" -O "$WRAPPER_JAR"
    elif command -v curl > /dev/null; then
      if [ "$MVNW_VERBOSE" = true ]; then
        echo "Downloading from: $MVNW_REPO_URL/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"
      fi
      mkdir -p "$(dirname "$WRAPPER_JAR")"
      curl -s -L "$MVNW_REPO_URL/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar" -o "$WRAPPER_JAR"
    else
      echo "The Maven wrapper cannot be downloaded from https://repo.maven.apache.org/maven2 and a download failed."
      echo "Please check you have a working internet connection."
      echo "If you do not have wget or curl, please download the Maven wrapper JAR manually from https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"
      echo "and place it under .mvn/wrapper"
      exit 1
    fi
  fi

  # Provide a "standardized" way to retrieve the CLI args that will
  # work with both Windows and non-Windows executions.
  MAVEN_CMD_LINE_ARGS="$MAVEN_ARGS"

  # Run in the current dir
  exec "$JAVA_HOME/bin/java" \
    $MAVEN_OPTS \
    "-Dmaven.multiModuleProjectDirectory=$PWD" \
    -classpath "$WRAPPER_JAR" \
    "$WRAPPER_LAUNCHER" $MAVEN_CMD_LINE_ARGS "$@"
}

# Attempt to locate JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
  JAVA_HOME="$(java -XshowSettings:properties -version 2>&1 | grep 'java.home' | awk -F= '{print $NF}' | sed 's/^[[:space:]]*//')"
  export JAVA_HOME
fi

# Set the repository URL
MVNW_REPO_URL="${MVNW_REPO_URL:-https://repo.maven.apache.org/maven2}"

# Call function
run "$@"
