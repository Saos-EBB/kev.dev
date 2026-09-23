#!/usr/bin/env bash
# Builds public/java/grundlagen.jar from java/ (Java 17 bytecode, for CheerpJ).
set -euo pipefail
cd "$(dirname "$0")/.."

JAVAC=${JAVAC:-javac}
JAR=${JAR:-jar}
if ! command -v "$JAVAC" >/dev/null; then
  JAVAC="java -m jdk.compiler/com.sun.tools.javac.Main"
  JAR="java -m jdk.jartool/sun.tools.jar.Main"
fi

out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT

# --release 17 where the JDK supports it, plain -source/-target otherwise.
if ! $JAVAC --release 17 -encoding UTF-8 -d "$out" $(find java -name '*.java') 2>/dev/null; then
  $JAVAC -source 17 -target 17 -Xlint:-options -encoding UTF-8 -d "$out" $(find java -name '*.java')
fi

mkdir -p public/java
$JAR --create --file public/java/grundlagen.jar -C "$out" .
echo "built public/java/grundlagen.jar"
